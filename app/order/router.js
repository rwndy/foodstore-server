const router = require('express').Router();
const multer = require('multer');

const orderController = require('./controller');

router.post('/orders', multer().none(), orderController.createOrder);
router.get('/orders', orderController.getOrder)

module.exports = router;