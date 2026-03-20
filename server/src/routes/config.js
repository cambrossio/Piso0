const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const authMiddleware = require('../middleware/auth');

router.get('/', configController.get);
router.post('/', authMiddleware, configController.set);
router.get('/delivery-check', configController.checkDeliveryAvailable);

module.exports = router;
