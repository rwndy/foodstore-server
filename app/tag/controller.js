const Tag = require('./model');
const { policyFor } = require('../policy');
const {
    sendSuccess,
    sendError,
    HTTP_STATUS,
} = require('../utils/responseHelper');

const createTag = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('create', 'Tag')) {
            return sendError(
                res,
                `You're not allowed to perform this action`,
                HTTP_STATUS.FORBIDDEN
            );
        }

        const payload = req.body;

        const tag = new Tag(payload);

        await tag.save();

        return sendSuccess(
            res,
            'Tag successfully created',
            { tag },
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

const updateTag = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('update', 'Tag')) {
            return sendError(
                res,
                `You're not allowed to perform this action`,
                HTTP_STATUS.FORBIDDEN
            );
        }
        const payload = req.body;
        const tag = await Tag.findOneAndUpdate(
            { _id: req.params.id },
            payload,
            { new: true, runValidators: true }
        );

        return sendSuccess(
            res,
            'Tag successufully updated',
            { tag },
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

const deleteTag = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('delete', 'Tag')) {
            return res.json({
                error: 1,
                message: `Anda tidak memiliki akses untuk menghapus tag`,
            });
        }

        const payload = Tag.findOneAndDelete({ _id: req.params.id });

        return sendSuccess(res, 'Tag has deleted', { payload }, HTTP_STATUS.OK);
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

const getTags = async (_, res, next) => {
    try {
        const tags = await Tag.find();
        return sendSuccess(
            res,
            'Tag retrieved successfully',
            { tags },
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

module.exports = { createTag, updateTag, deleteTag, getTags };
