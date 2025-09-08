const router = require('express').Router();
const multer = require('multer');

const cartController = require('./controller');

router.put('/carts', multer().none(), cartController.updateCart);
router.get('/carts', cartController.getCartItem)

module.exports = router;