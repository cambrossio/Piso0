const express = require('express');
const router = express.Router();
const mesaController = require('../controllers/mesaController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

router.get('/', mesaController.getAll);
router.get('/qr/:codigoQR', mesaController.getByCodigoQR);
router.get('/:id', mesaController.getById);
router.get('/:id/qr', authMiddleware, adminMiddleware, mesaController.getQR);
router.post('/', authMiddleware, adminMiddleware, mesaController.create);
router.put('/:id', authMiddleware, adminMiddleware, mesaController.update);
router.delete('/:id', authMiddleware, adminMiddleware, mesaController.delete);

module.exports = router;
