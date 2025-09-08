const router = require('express').Router();
const multer = require('multer');
const tagController = require('./controller');

router.post('/tags', multer().none(), tagController.createTag);
router.put('/tags/:id', multer().none(), tagController.updateTag);
router.delete('/tags/:id', tagController.deleteTag);
router.get('/tags', tagController.getTags)

module.exports = router;
