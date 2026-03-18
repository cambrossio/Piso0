const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, pedidoController.getAll);
router.get('/:id', authMiddleware, pedidoController.getById);
router.get('/mesa/:codigoQR', authMiddleware, pedidoController.getByMesa);
router.post('/', authMiddleware, pedidoController.create);
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const Pedido = require('../models/Pedido');
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    const { estado, tipoPago, transaccionCreada } = req.body;
    const updateData = {};
    if (estado !== undefined) updateData.estado = estado;
    if (tipoPago !== undefined) updateData.tipoPago = tipoPago;
    if (transaccionCreada !== undefined) updateData.transaccionCreada = transaccionCreada;
    await pedido.update(updateData);
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.put('/:id/agregar', authMiddleware, pedidoController.agregarItems);
router.put('/:id/estado', authMiddleware, pedidoController.updateEstado);
router.post('/:id/pago', authMiddleware, pedidoController.pagar);
router.post('/:id/cancelar', authMiddleware, pedidoController.cancelar);
router.post('/crear-preferencia', authMiddleware, pedidoController.crearPreferenciaMP);
router.post('/webhook', pedidoController.webhookMP);
router.post('/delivery', authMiddleware, pedidoController.createDelivery);
router.post('/crear-preferencia-delivery', authMiddleware, pedidoController.crearPreferenciaMPDelivery);

module.exports = router;
