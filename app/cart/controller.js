const { policyFor } = require('../policy');
const Product = require('../product/model');
const CartItem = require('../cart-item/model');

const updateCart = async (req, res, next) => {
    const policy = policyFor(req.user);

    if (policy.can('update', 'Cart')) {
        return res.json({
            error: 1,
            message: `You're not allowed to perform this action`,
        });
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

        return res.json(cartItems);
    } catch (error) {
        if (error && error.name == 'ValidationError') {
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors,
            });
        }
        next(error);
    }
};

const getCartItem = async (req, res, next) => {
    const policy = policyFor(req.user);

    if (policy.can('read', 'Cart')) {
        return res.json({
            error: 1,
            message: `You're not allowed to perform this action`,
        });
    }

    try {
        const items = await CartItem.find({ user: req.user._id }).populate(
            'product'
        );
        return res.json(items);
    } catch (error) {
        if (error && error.name == 'ValidationError') {
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors,
            });
        }
        next(error);
    }
};

module.exports = { updateCart, getCartItem };
