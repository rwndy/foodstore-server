const mongoose = require('mongoose');
const Order = require('./model');
const OrderItem = require('../order-item/model');
const CartItem = require('../cart-item/model');
const DeliveryAddress = require('../delivery-address/model');
const { policyFor } = require('../policy');
const { subject } = require('@casl/ability');

const createOrder = async (req, res, next) => {
    const policy = policyFor(req.user);

    if (!policy.can('create', 'Order')) {
        return res.json({
            error: 1,
            message: `You're not allowed to perform this action`,
        });
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
            return res.json({
                error: 1,
                message: `Can't create order because you have not item in cart`,
            });
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
        return res.json(order);
    } catch (error) {
        if (error && error.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: error.message,
                fields: error.errors,
            });
        }

        next(error)
    }
};

const getOrder = async (req, res, next) => {
    const policy = policyFor(req.user);

    if (!policy.can('view', 'Order')) {
        return res.json({
            error: 1,
            message: `You're not allowed to perform this action`,
        });
    }
    try {
        const { limit = 10, skip = 0 } = req.query;

        const count = await Order.find({ user: req.user._id }).countDocuments();
        const orders = await Order.find({ user: req.user._id })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .populate('order_items')
            .sort('-createdAt');

        return res.json({
            data: orders.map(order => order.toJSON({ virtuals: true })),
            count,
        });

    } catch (error) {
        if (error && error.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: error.message,
                fields: error.errors,
            });
        }

        next(error)
    }
};

module.exports = { createOrder, getOrder };
