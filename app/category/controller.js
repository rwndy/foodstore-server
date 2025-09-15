const Category = require('./model');
const { policyFor } = require('../policy');
const {
    sendSuccess,
    sendError,
    HTTP_STATUS,
} = require('../utils/responseHelper');

const createCategory = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('create', 'Category')) {
            return sendError(
                res,
                'Anda tidak memiliki akses untuk membuat kategori',
                HTTP_STATUS.FORBIDDEN
            );
        }

        const payload = req.body;

        const category = new Category(payload);

        await category.save();

        return sendSuccess(
            res,
            'Categore created successfully',
            { category },
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

const updateCategory = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('update', 'Category')) {
            return sendError(
                res,
                'Anda tidak memiliki akses untuk mengubah kategori',
                HTTP_STATUS.FORBIDDEN
            );
        }

        const payload = req.body;

        const category = await Category.findOneAndUpdate(
            { _id: req.params.id },
            payload,
            { new: true, runValidators: true }
        );

        return sendSuccess(
            res,
            'Category updated successfully',
            { category },
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

const deleteCategory = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('delete', 'Category')) {
            return sendError(
                res,
                'Anda tidak memiliki akses untuk menghapus kategori',
                HTTP_STATUS.FORBIDDEN
            );
        }
        const payload = await Category.findOneAndDelete({ _id: req.params.id });
        return sendSuccess(
            res,
            'Category deleted successfully',
            { payload },
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

const getCategories = async (_, res, next) => {
    try {
        const categories = await Category.find();

        return sendSuccess(
            res,
            'Category retrieved successfully',
            categories,
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

module.exports = {
    createCategory,
    updateCategory,
    deleteCategory,
    getCategories,
};
