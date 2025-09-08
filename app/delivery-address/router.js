const router = require('express').Router();
const multer = require('multer');

const addressController = require('./controller');

router.post('/delivery-addresses', multer().none(), addressController.createAddress);
router.put('/delivery-addresses/:id', multer().none(), addressController.updateAddress)
router.delete('/delivery-addresses/:id', addressController.deleteAddress)
router.get('/delivery-addresses', addressController.getAddress)

module.exports = router;
