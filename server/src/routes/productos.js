const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

router.get('/', productoController.getAll);
router.get('/bajo-stock', authMiddleware, adminMiddleware, productoController.getLowStock);
router.get('/:id', productoController.getById);
router.post('/', authMiddleware, adminMiddleware, productoController.create);
router.put('/:id', authMiddleware, adminMiddleware, productoController.update);
router.delete('/:id', authMiddleware, adminMiddleware, productoController.delete);

module.exports = router;
