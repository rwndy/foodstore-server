const Tag = require('./model');
const { policyFor } = require('../policy');

const createTag = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('create', 'Tag')) {
            return res.json({
                error: 1,
                message: `Anda tidak memiliki akses untuk membuat tag`,
            });
        }

        const payload = req.body;

        const tag = new Tag(payload);

        await tag.save();

        return res.json(tag);
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

const updateTag = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('update', 'Tag')) {
            return res.json({
                error: 1,
                message: `Anda tidak memiliki akses untuk mengupdate tag`,
            });
        }
        const payload = req.body;
        const tag = await Tag.findOneAndUpdate(
            { _id: req.params.id },
            payload,
            { new: true, runValidators: true }
        );
        return res.json(tag);
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
        return res.json(payload);
    } catch (error) {
        next(error);
    }
};

const getTags = async (_, res, next) => {
    try {
        const tags = await Tag.find();
        return res.json(tags);
    } catch (error) {
        next(error);
    }
};

module.exports = { createTag, updateTag, deleteTag, getTags };
