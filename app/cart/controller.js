const { policyFor } = require('../policy');
const Product = require('../product/model');
const CartItem = require('../cart-item/model');
const {
    sendSuccess,
    sendError,
    HTTP_STATUS,
} = require('../utils/responseHelper');

const updateCart = async (req, res, next) => {
    const policy = policyFor(req.user);

    if (policy.can('update', 'Cart')) {
        return sendError(
            res,
            `You're not allowed to perform this action`,
            HTTP_STATUS.FORBIDDEN
        );
    }

    try {
        const { items } = req.body;
        const productId = items.map(item => item._id);

        const products = await Product.find({ _id: { $in: productId } });
        const cartItems = items.map(item => {
            const relatedProduct = products.find(
                product => product._id.toString() === item._id
            );

            return {
                _id: relatedProduct._id,
                product: relatedProduct._id,
                price: relatedProduct.price,
                image_url: relatedProduct.image_url,
                name: relatedProduct.name,
                user: req.user._id,
                qty: item.qty,
            };
        });

        await CartItem.bulkWriter(
            cartItems.map(cart => {
                return {
                    updateOne: {
                        filter: {
                            user: req.user._id,
                            product: cart.product,
                        },
                        update: cart,
                        upsert: true,
                    },
                };
            })
        );

        return sendSuccess(
            res,
            `cart items updated successfully`,
            {
                cart_items: cartItems,
            },
            HTTP_STATUS.OK
        );
    } catch (error) {
        if (error && error.name == 'ValidationError') {
            return sendError(
                res,
                error.message,
                HTTP_STATUS.UNPROCESSABLE_ENTITY,
                { fields: error.errors }
            );
        }
        return sendError(
            res,
            'Internal server error',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
    }
};

const getCartItem = async (req, res, next) => {
    const policy = policyFor(req.user);

    if (policy.can('read', 'Cart')) {
        return sendError(
            res,
            `You're not allowed to perform this action`,
            HTTP_STATUS.FORBIDDEN
        );
    }

    try {
        const items = await CartItem.find({ user: req.user._id }).populate(
            'product'
        );
        return sendSuccess(
            res,
            `Successfully get carts`,
            {
                carts: items,
            },
            HTTP_STATUS.OK
        );
    } catch (error) {
        if (error && error.name == 'ValidationError') {
            return sendError(
                res,
                error.message,
                HTTP_STATUS.UNPROCESSABLE_ENTITY,
                { fields: error.errors }
            );
        }
        return sendError(
            res,
            'Internal server error',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
    }
};

module.exports = { updateCart, getCartItem };
