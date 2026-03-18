const Mesa = require('../models/Mesa');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

exports.getAll = async (req, res) => {
  try {
    const mesas = await Mesa.findAll({
      order: [['numero', 'ASC']]
    });
    res.json(mesas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const mesa = await Mesa.findByPk(req.params.id);
    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }
    res.json(mesa);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { numero, capacidad } = req.body;

    const mesaExistente = await Mesa.findOne({ where: { numero } });
    if (mesaExistente) {
      return res.status(400).json({ error: 'Ya existe una mesa con ese número' });
    }

    const codigoQR = uuidv4();

    const mesa = await Mesa.create({
      numero,
      capacidad: capacidad || 4,
      codigoQR,
      estado: 'libre'
    });

    res.status(201).json(mesa);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const mesa = await Mesa.findByPk(req.params.id);
    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    const { numero, capacidad, estado } = req.body;

    if (estado === 'libre' && mesa.estado !== 'libre') {
      const Pedido = require('../models/Pedido');
      const pedidosPendientes = await Pedido.findAll({
        where: {
          mesaId: mesa.id,
          estado: { [require('sequelize').Op.notIn]: ['entregado', 'cancelado'] }
        }
      });
      
      const sinPagar = pedidosPendientes.filter(p => !p.tipoPago);
      if (sinPagar.length > 0) {
        return res.status(400).json({ 
          error: `No se puede liberar la mesa. Hay ${sinPagar.length} pedido(s) sin pagar.`
        });
      }
      
      await Pedido.update(
        { estado: 'entregado' },
        { where: { mesaId: mesa.id, estado: { [require('sequelize').Op.notIn]: ['entregado', 'cancelado'] } } }
      );
    }

    await mesa.update({
      numero: numero !== undefined ? numero : mesa.numero,
      capacidad: capacidad !== undefined ? capacidad : mesa.capacidad,
      estado: estado || mesa.estado
    });

    res.json(mesa);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const mesa = await Mesa.findByPk(req.params.id);
    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    await mesa.destroy();
    res.json({ message: 'Mesa eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQR = async (req, res) => {
  try {
    const mesa = await Mesa.findByPk(req.params.id);
    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    const url = `http://localhost:5173/mesa/${mesa.codigoQR}`;
    const qrImage = await QRCode.toDataURL(url);

    res.json({
      mesaId: mesa.id,
      numero: mesa.numero,
      codigoQR: mesa.codigoQR,
      qrImage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getByCodigoQR = async (req, res) => {
  try {
    const mesa = await Mesa.findOne({ where: { codigoQR: req.params.codigoQR } });
    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }
    res.json(mesa);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
