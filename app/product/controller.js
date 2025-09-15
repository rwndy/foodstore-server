const Product = require('./model');
const Category = require('../category/model');
const Tag = require('../tag/model');

const config = require('../config');
const fs = require('fs');
const path = require('path');
const { policyFor } = require('../policy');
const { createPaginationMeta } = require('../utils/pagination');
const {
    sendSuccess,
    sendError,
    HTTP_STATUS,
} = require('../utils/responseHelper');

const store = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('create', 'Product')) {
            return sendError(
                res,
                'Anda tidak memiliki akses untuk membuat produk',
                HTTP_STATUS.FORBIDDEN
            );
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
                    let product = new Product({
                        ...payload,
                        image_url: filename,
                    });
                    await product.save();

                    return sendSuccess(
                        res,
                        'Product created successfully',
                        { product },
                        HTTP_STATUS.CREATED
                    );
                } catch (error) {
                    fs.unlinkSync(target_path);

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
            });

            src.on('error', () => {
                return sendError(
                    res,
                    'File upload failed',
                    HTTP_STATUS.INTERNAL_SERVER_ERROR
                );
            });
        } else {
            let product = new Product(payload);
            await product.save();

            return sendSuccess(
                res,
                'Product created successfully',
                { product },
                HTTP_STATUS.CREATED
            );
        }
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

const getProducts = async (req, res, next) => {
    try {
        let {
            limit = 10,
            skip = 0,
            page = 1,
            q = '',
            category = '',
            tags = [],
        } = req.query;

        // Convert page to skip if page is provided
        if (page && !req.query.skip) {
            skip = (parseInt(page) - 1) * parseInt(limit);
        }

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

        // Get total count for pagination
        let count = await Product.find(criteria).countDocuments();

        // Get products with pagination
        let products = await Product.find(criteria)
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .populate('category')
            .populate('tags')
            .select('-__v');

        // Create pagination metadata
        const meta = createPaginationMeta(
            count,
            parseInt(limit),
            parseInt(skip)
        );

        // Create response data
        const responseData = {
            products,
            meta,
        };

        return sendSuccess(
            res,
            'Products retrieved successfully',
            responseData,
            HTTP_STATUS.OK
        );
    } catch (error) {
        return sendError(
            res,
            'Internal server error',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
    }
};

const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return sendError(
                res,
                'Invalid product ID format',
                HTTP_STATUS.BAD_REQUEST
            );
        }

        const product = await Product.findById(id)
            .populate('category')
            .populate('tags')
            .select('-__v');

        if (!product) {
            return sendError(res, 'Product not found', HTTP_STATUS.NOT_FOUND);
        }

        return sendSuccess(
            res,
            'Product retrieved successfully',
            { product },
            HTTP_STATUS.OK
        );
    } catch (error) {
        if (error.name === 'CastError') {
            return sendError(
                res,
                'Invalid product ID',
                HTTP_STATUS.BAD_REQUEST
            );
        }

        return sendError(
            res,
            'Internal server error',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
    }
};

const updateProduct = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('update', 'Product')) {
            return sendError(
                res,
                'Anda tidak memiliki akses untuk mengupdate produk',
                HTTP_STATUS.FORBIDDEN
            );
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
                    let product = await Product.findOne({ _id: req.params.id });

                    if (!product) {
                        return sendError(
                            res,
                            'Product not found',
                            HTTP_STATUS.NOT_FOUND
                        );
                    }

                    let currentImage = `${config.rootPath}/public/upload/${product.image_url}`;

                    if (fs.existsSync(currentImage)) {
                        fs.unlinkSync(currentImage);
                    }

                    product = await Product.findOneAndUpdate(
                        { _id: req.params.id },
                        { ...payload, image_url: filename },
                        { new: true, runValidators: true }
                    );

                    return sendSuccess(
                        res,
                        'Product updated successfully',
                        { product },
                        HTTP_STATUS.OK
                    );
                } catch (error) {
                    fs.unlinkSync(target_path);

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
            });

            src.on('error', () => {
                return sendError(
                    res,
                    'File upload failed',
                    HTTP_STATUS.INTERNAL_SERVER_ERROR
                );
            });
        } else {
            let product = await Product.findOneAndUpdate(
                { _id: req.params.id },
                payload,
                { new: true, runValidators: true }
            );

            if (!product) {
                return sendError(
                    res,
                    'Product not found',
                    HTTP_STATUS.NOT_FOUND
                );
            }

            return sendSuccess(
                res,
                'Product updated successfully',
                { product },
                HTTP_STATUS.OK
            );
        }
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

const deleteProduct = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        if (!policy.can('delete', 'Product')) {
            return sendError(
                res,
                'Anda tidak memiliki akses untuk menghapus produk',
                HTTP_STATUS.FORBIDDEN
            );
        }

        let product = await Product.findOneAndDelete({ _id: req.params.id });

        if (!product) {
            return sendError(res, 'Product not found', HTTP_STATUS.NOT_FOUND);
        }

        let currentImage = `${config.rootPath}/public/upload/${product.image_url}`;

        if (fs.existsSync(currentImage)) {
            fs.unlinkSync(currentImage);
        }

        return sendSuccess(
            res,
            'Product deleted successfully',
            { product },
            HTTP_STATUS.OK
        );
    } catch (error) {
        return sendError(
            res,
            'Internal server error',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
    }
};

module.exports = {
    store,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};
