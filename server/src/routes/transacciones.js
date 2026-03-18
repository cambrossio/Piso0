const express = require('express');
const router = express.Router();
const transaccionController = require('../controllers/transaccionController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

router.get('/', authMiddleware, adminMiddleware, transaccionController.getAll);
router.get('/resumen', authMiddleware, adminMiddleware, transaccionController.getResumen);
router.get('/historial', authMiddleware, adminMiddleware, transaccionController.getHistorial);
router.get('/comandas', authMiddleware, adminMiddleware, transaccionController.getHistorialComandas);
router.get('/estado-dia', authMiddleware, adminMiddleware, transaccionController.getEstadoDia);
router.post('/', authMiddleware, adminMiddleware, transaccionController.create);
router.post('/cierre', authMiddleware, adminMiddleware, transaccionController.cierreDia);

module.exports = router;
