const mongoose = require('mongoose');
const Order = require('./model');
const OrderItem = require('../order-item/model');
const CartItem = require('../cart-item/model');
const DeliveryAddress = require('../delivery-address/model');
const { policyFor } = require('../policy');
const {
    sendSuccess,
    sendError,
    HTTP_STATUS,
} = require('../utils/responseHelper');
const { createPaginationMeta } = require('../utils/pagination');

const createOrder = async (req, res, next) => {
    const policy = policyFor(req.user);

    if (!policy.can('create', 'Order')) {
        return sendError(
            res,
            `You're not allowed to perform this action`,
            HTTP_STATUS.FORBIDDEN
        );
    }

    try {
        const { delivery_fee, delivery_address } = req.body;
        const items = await CartItem.find({ user: req.user_.id }).populate(
            'product'
        );
        const address = await DeliveryAddress.findOne({
            _id: delivery_address,
        });

        if (!items.length) {
            return sendError(
                res,
                `Can't create order because you have not item in cart`,
                HTTP_STATUS.BAD_REQUEST
            );
        }

        const order = new Order({
            _id: new mongoose.Types.ObjectId(),
            status: 'waiting_payment',
            delivery_fee,
            delivery_address: {
                provinsi: address.provinsi,
                kabupaten: address.kabupaten,
                kecamatan: address.kecamatan,
                kelurahan: address.kelurahan,
                detail: address.detail,
            },
            user: req.user._id,
        });

        const orderItems = await OrderItem.inserMany(
            items.map(item => ({
                ...item,
                name: item.product.name,
                qty: parseInt(item.qty),
                price: parseInt(item.product.price),
                order: order._id,
                prodcut: item.product._id,
            }))
        );

        orderItems.forEach(item => order.oder_items.push(item));
        await order.save();

        await CartItem.deleteMany({ user: req.user._id });

        return sendSuccess(
            res,
            'Order successfully created',
            { oreder },
            HTTP_STATUS.CREATED
        );
    } catch (error) {
        if (error && error.name === 'ValidationError') {
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

const getOrder = async (req, res, next) => {
    const policy = policyFor(req.user);

    if (!policy.can('view', 'Order')) {
        return sendError(
            res,
            `You're not allowed to perform this action`,
            HTTP_STATUS.FORBIDDEN
        );
    }
    try {
        const { limit = 10, skip = 0, page = 1 } = req.query;

        if (page && !req.query.skip) {
            skip = (parseInt(page) - 1) * parseInt(limit);
        }

        const count = await Order.find({ user: req.user._id }).countDocuments();
        const orders = await Order.find({ user: req.user._id })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .populate('order_items')
            .sort('-createdAt');

        const meta = createPaginationMeta(
            count,
            parseInt(limit),
            parseInt(skip)
        );

        const responseData = {
            orders: orders.map(order => order.toJSON({ virtuals: true })),
            meta,
        };
        return sendSuccess(
            res,
            'Order retrieved successfully',
            responseData,
            HTTP_STATUS.OK
        );
    } catch (error) {
        if (error && error.name === 'ValidationError') {
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

module.exports = { createOrder, getOrder };
