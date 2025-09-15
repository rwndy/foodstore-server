const DeliveryAddressModel = require('./model');
const { policyFor } = require('../policy');
const { subject } = require('@casl/ability');
const {
    sendSuccess,
    HTTP_STATUS,
    sendError,
} = require('../utils/responseHelper');
const { createPaginationMeta } = require('../utils/pagination');

const createAddress = async (req, res, next) => {
    const policy = policyFor(req.user);

    if (!policy.can('create', 'DeliveryAddress')) {
        return sendError(
            res,
            `You're not allowed to perform this action`,
            HTTP_STATUS.FORBIDDEN
        );
    }

    try {
        const payload = req.body;
        const user = req.user;

        const address = new DeliveryAddressModel({
            ...payload,
            user: user._id,
        });
        await address.save();

        return sendSuccess(
            res,
            'Address created successfully',
            { address },
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
            return sendError(
                res,
                `You're not allowed to perform this action`,
                HTTP_STATUS.FORBIDDEN
            );
        }

        address = await DeliveryAddress.findOneAndUpdate({ _id: id }, payload, {
            new: true,
        });

        return sendSuccess(
            res,
            'Address successfully updated',
            { address },
            HTTP_STATUS.OK
        );
    } catch (error) {
        if (error && error.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors,
            });
        }
        return sendError(
            res,
            'Internal server error',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
    }
};

const deleteAddress = async (req, res, next) => {
    const policy = policyFor(req.user);
    try {
        const { id } = req.params;
        const subjectAddress = subject({ ...address, user: address.user });

        if (!policy.can('delete', subjectAddress)) {
            return sendError(
                res,
                `You're not allowed to perform this action`,
                HTTP_STATUS.FORBIDDEN
            );
        }
        const address = await DeliveryAddress.findOneAndDelete({ _id: id });
        return sendSuccess(
            res,
            'Address successfully deleted',
            { address },
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

const getAddress = async (req, res, next) => {
    const policy = policyFor(req.user);

    if (!policy.can('view', 'DeliveryAddress')) {
        return res.json({
            error: 1,
            message: `You're not allowed to perform this action`,
        });
    }

    try {
        const { limit = 10, skip = 0, page = 1 } = req.query;

        if (page && !req.query.skip) {
            skip = (parseInt(page) - 1) * parseInt(limit);
        }

        const count = await DeliveryAddressModel.find({
            user: req.user._id,
        }).countDocuments();

        const deliveryAddres = await DeliveryAddressModel.find({
            user: req.user._id,
        })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .sort('-createdAt');

        const meta = createPaginationMeta(
            count,
            parseInt(limit),
            parseInt(skip)
        );

        const responseData = { address: deliveryAddres, meta };

        return sendSuccess(
            res,
            'Address retrieved successfully',
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

module.exports = { createAddress, updateAddress, deleteAddress, getAddress };
