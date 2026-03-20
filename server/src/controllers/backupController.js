const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');
const Mesa = require('../models/Mesa');
const Transaccion = require('../models/Transaccion');
const Usuario = require('../models/Usuario');

exports.createBackup = async (req, res) => {
  try {
    const pedidos = await Pedido.findAll();
    const productos = await Producto.findAll();
    const mesas = await Mesa.findAll();
    const transacciones = await Transaccion.findAll();
    const usuarios = await Usuario.findAll({ attributes: { exclude: ['password'] } });

    const backup = {
      fecha: new Date().toISOString(),
      version: '1.0',
      data: {
        pedidos: pedidos.map(p => p.toJSON()),
        productos: productos.map(p => p.toJSON()),
        mesas: mesas.map(m => m.toJSON()),
        transacciones: transacciones.map(t => t.toJSON()),
        usuarios: usuarios.map(u => u.toJSON())
      }
    };

    res.json(backup);
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.restoreBackup = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !data.pedidos || !data.productos || !data.mesas || !data.transacciones) {
      return res.status(400).json({ error: 'Backup inválido' });
    }

    await Pedido.destroy({ where: {} });
    for (const pedido of data.pedidos) {
      await Pedido.create(pedido);
    }

    await Producto.destroy({ where: {} });
    for (const producto of data.productos) {
      await Producto.create(producto);
    }

    await Mesa.destroy({ where: {} });
    for (const mesa of data.mesas) {
      await Mesa.create(mesa);
    }

    await Transaccion.destroy({ where: {} });
    for (const transaccion of data.transacciones) {
      await Transaccion.create(transaccion);
    }

    res.json({ message: 'Backup restaurado correctamente' });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: error.message });
  }
};
