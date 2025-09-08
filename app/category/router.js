const router = require('express').Router();
const multer = require('multer');

const categoryController = require('./controller');

router.post('/categories', multer().none(), categoryController.createCategory);
router.put(
    '/categories/:id',
    multer().none(),
    categoryController.updateCategory
);
router.delete('/categories/:id', categoryController.deleteCategory)
router.get('/categories', categoryController.getCategories)

module.exports = router;
