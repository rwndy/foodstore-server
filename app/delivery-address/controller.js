const DeliveryAddressModel = require('./model');
const { policyFor } = require('../policy');
const { subject } = require('@casl/ability');

const createAddress = async (req, res, next) => {
    const policy = policyFor(req.user);

    if (!policy.can('create', 'DeliveryAddress')) {
        return res.json({
            error: 1,
            message: `You're not allowed to perform this action`,
        });
    }

    try {
        const payload = req.body;
        const user = req.user;

        const address = new DeliveryAddressModel({
            ...payload,
            user: user._id,
        });
        await address.save();

        return res.json(address);
    } catch (error) {
        if (error && error.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors,
            });
        }
        next(error);
    }
};

const updateAddress = async (req, res, next) => {
    const policy = policyFor(req.user);

    try {
        const { id } = req.params;
        const { _id, ...payload } = req.body;

        const subjectAddress = subject('DeliveryAddress', {
            ...address,
            user_id: address.user,
        });

        let address = await DeliveryAddress.findOne({ _id: id });

        if (!policy.can('update', subjectAddress)) {
            return res.json({
                error: 1,
                message: `You're not allowed to perform this action`,
            });
        }

        address = await DeliveryAddress.findOneAndUpdate({ _id: id }, payload, {
            new: true,
        });

        res.json(address);
    } catch (error) {
        if (error && error.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors,
            });
        }
        next(error);
    }
};

const deleteAddress = async (req, res, next) => {
    const policy = policyFor(req.user);
    try {
        const { id } = req.params;
        const subjectAddress = subject({ ...address, user: address.user });

        if (!policy.can('delete', subjectAddress)) {
            return res.json({
                error: 1,
                message: `You're not allowed to delete this resource`,
            });
        }
        await DeliveryAddress.findOneAndDelete({ _id: id });
        return res.json(address);
    } catch (error) {
        if (error && error.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors,
            });
        }
        next(error);
    }
};

const getAddress = async (req, res, next) => {
    const policy = policyFor(req.user);

    if (!policy.can('view', 'DeliveryAddress')) {
        return res.json({
            error: 1,
            message: `You're not allowed to perform this action`,
        });
    }

    try {
        const { limit = 10, skip = 0 } = req.query;
        const count = await DeliveryAddressModel.find({
            user: req.user._id,
        }).countDocuments();

        const deliveryAddres = await DeliveryAddressModel.find({
            user: req.user._id,
        })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .sort('-createdAt');

        return res.json({ data: deleteAddress, count });
    } catch (error) {
        if (error && error.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors,
            });
        }
        next(error);
    }
};

module.exports = { createAddress, updateAddress, deleteAddress, getAddress };
