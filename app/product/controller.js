const Product = require('./model');
const Category = require('../category/model');
const Tag = require('../tag/model');

const config = require('../config');
const fs = require('fs');
const path = require('path');
const { policyFor } = require('../policy');

const store = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('create', 'Product')) {
            return res.json({
                error: 1,
                message: `Anda tidak memiliki akses untuk membuat produk`,
            });
        }

        let payload = req.body;

        if (payload.tags && payload.tags.length) {
            const tags = await Tag.find({ name: { $in: payload.tags } });

            if (tags.length) {
                payload = { ...payload, tags: tags.map(tag => tag._id) };
            }
        }

        if (payload.category) {
            const category = await Category.findOne({
                name: { $regex: payload.category, $options: 'i' },
            });

            if (category) {
                payload = { ...payload, category: category._id };
            } else {
                delete payload.category;
            }
        }

        if (req.file) {
            let tmp_path = req.file.path;
            let originalExt =
                req.file.originalname.split('.')[
                    req.file.originalname.split('.').length - 1
                ];
            let filename = req.file.filename + '.' + originalExt;

            let target_path = path.resolve(
                config.rootPath,
                `public/upload/${filename}`
            );
            const src = fs.createReadStream(tmp_path);
            const dest = fs.createWriteStream(target_path);
            src.pipe(dest);

            src.on('end', async () => {
                try {
                    product = new Product({ ...payload, image_url: filename });
                    await product.save();
                    return res.json(product);
                } catch (error) {
                    fs.unlinkSync(target_path);

                    if (error && error.name === 'ValidationError') {
                        return res.json({
                            error: 1,
                            message: error.message,
                            fields: error.errors,
                        });
                    }

                    next(error);
                }
            });
        } else {
            let payload = req.body;
            let product = new Product(payload);

            await product.save();

            return res.json(product);
        }
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

const getProducts = async (req, res, next) => {
    try {
        let {
            limit = 10,
            skip = 0,
            q = '',
            category = '',
            tags = [],
        } = req.query;

        let criteria = {};

        if (tags.length) {
            tags = await Tag.find({ name: { $in: tags } });
            criteria = { ...criteria, tags: { $in: tags.map(tag => tag._id) } };
        }

        if (category.length) {
            category = await Category.findOne({
                name: { $regex: `${category}`, $options: 'i' },
            });
            if (category) {
                criteria = { ...criteria, category: category._id };
            }
        }

        if (q.length) {
            criteria = {
                ...criteria,
                name: { $regex: `${q}`, $options: 'i' },
            };
        }

        let count = await Product.find(criteria).countDocuments();

        let products = await Product.find(criteria)
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .populate('category')
            .populate('tags')
            .select('-__v');
        return res.json({ data: products, count });
    } catch (error) {
        next(error);
    }
};

const updateProduct = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('update', 'Product')) {
            return res.json({
                error: 1,
                message: `Anda tidak memiliki akses untuk mengupdate produk`,
            });
        }

        let payload = req.body;

        if (payload.tags && payload.tags.length) {
            const tags = await Tag.find({ name: { $in: payload.tags } });

            if (tags.length) {
                payload = { ...payload, tags: tags.map(tag => tag._id) };
            }
        }

        if (payload.category) {
            const category = await Category.findOne({
                name: { $regex: payload.category, $options: 'i' },
            });

            if (category) {
                payload = { ...payload, category: category._id };
            } else {
                delete payload.category;
            }
        }
        if (req.file) {
            let tmp_path = req.file.path;
            let originalExt =
                req.file.originalname.split('.')[
                    req.file.originalname.split('.').length - 1
                ];
            let filename = req.file.filename + '.' + originalExt;
            let target_path = path.resolve(
                config.rootPath,
                `public/upload/${filename}`
            );
            const src = fs.createReadStream(tmp_path);
            const dest = fs.createWriteStream(target_path);
            src.pipe(dest);

            src.on('end', async () => {
                try {
                    let currentImage = `${config.rootPath}/public/upload/${product.image_url}`;

                    if (fs.existsSync(currentImage)) {
                        fs.unlinkSync(currentImage);
                    }

                    let product = await Product.findOne({ _id: req.params.id });
                    product = await Product.findOneAndUpdate(
                        { _id: req.params.id },
                        { ...payload, image_url: filename },
                        { new: true, runValidators: true }
                    );
                    return res.json(product);
                } catch (error) {
                    fs.unlinkSync(target_path);

                    if (error && error.name === 'ValidationError') {
                        return res.json({
                            error: 1,
                            message: error.message,
                            fields: error.errors,
                        });
                    }

                    next(error);
                }
            });
        } else {
            let payload = req.body;
            let product = await Product.findOneAndUpdate(
                { _id: req.params.id },
                payload,
                { new: true, runValidators: true }
            );
            return res.json(product);
        }
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

const deleteProduct = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('delete', 'Product')) {
            return res.json({
                error: 1,
                message: `Anda tidak memiliki akses untuk menghapus produk`,
            });
        }

        let product = await Product.findOneAndDelete({ _id: req.params.id });
        let currentImage = `${config.rootPath}/public/upload/${product.image_url}`;

        if (fs.existsSync(currentImage)) {
            fs.unlinkSync(currentImage);
        }

        return res.json(product);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    store,
    getProducts,
    updateProduct,
    deleteProduct,
};
