const Category = require('./model');
const { policyFor } = require('../policy');

const createCategory = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('create', 'Category')) {
            return res.json({
                error: 1,
                message: `Anda tidak memiliki akses untuk membuat kategori`,
            });
        }

        const payload = req.body;

        const category = new Category(payload);

        await category.save();

        return res.json(category);
    } catch (error) {
        if (error && error.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: error.message,
                fields: error.errors,
            });
        }
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('update', 'Category')) {
            return res.json({
                error: 1,
                message: `Anda tidak memiliki akses untuk mengupdate
kategori`,
            });
        }

        const payload = req.body;

        const category = await Category.findOneAndUpdate(
            { _id: req.params.id },
            payload,
            { new: true, runValidators: true }
        );

        return res.json(category);
    } catch (error) {
        if (error && error.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: error.message,
                fields: error.errors,
            });
        }
        next(error);
    }
};

const deleteCategory = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('delete', 'Category')) {
            return res.json({
                error: 1,
                message: `Anda tidak memiliki akses untuk menghapus
kategori`,
            });
        }
        const payload = await Category.findOneAndDelete({ _id: req.params.id });
        return res.json(payload);
    } catch (error) {
        next(error);
    }
};

const getCategories = async (_, res, next) => {
    try {
        const categories = await Category.find();

        return res.json(categories);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCategory,
    updateCategory,
    deleteCategory,
    getCategories,
};
