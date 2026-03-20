const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, backupController.createBackup);
router.post('/restore', authMiddleware, backupController.restoreBackup);

module.exports = router;
