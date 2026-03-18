const Transaccion = require('../models/Transaccion');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const { tipo, fechaInicio, fechaFin } = req.query;
    const where = {};
    
    if (tipo) where.tipo = tipo;
    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) where.createdAt[Op.gte] = new Date(fechaInicio);
      if (fechaFin) where.createdAt[Op.lte] = new Date(fechaFin);
    }

    const transacciones = await Transaccion.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    res.json(transacciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { tipo, categoria, monto, descripcion } = req.body;

    const transaccion = await Transaccion.create({
      tipo,
      categoria,
      monto,
      descripcion
    });

    res.status(201).json(transaccion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getResumen = async (req, res) => {
  try {
    const { periodo } = req.query;
    let fechaInicio;

    switch (periodo) {
      case 'dia':
        fechaInicio = new Date();
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - 7);
        break;
      case 'mes':
        fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
        break;
      default:
        fechaInicio = new Date();
        fechaInicio.setHours(0, 0, 0, 0);
    }

    const transacciones = await Transaccion.findAll({
      where: {
        createdAt: { [Op.gte]: fechaInicio }
      }
    });

    const ingresos = transacciones
      .filter(t => t.tipo === 'ingreso')
      .reduce((sum, t) => sum + parseFloat(t.monto), 0);

    const gastos = transacciones
      .filter(t => t.tipo === 'gasto')
      .reduce((sum, t) => sum + parseFloat(t.monto), 0);

    const porCategoria = {};
    transacciones.forEach(t => {
      if (!porCategoria[t.categoria]) {
        porCategoria[t.categoria] = { ingresos: 0, gastos: 0 };
      }
      porCategoria[t.categoria][t.tipo] += parseFloat(t.monto);
    });

    res.json({
      ingresos,
      gastos,
      balance: ingresos - gastos,
      transacciones: transacciones.length,
      porCategoria
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cierreDia = async (req, res) => {
  try {
    const fecha = req.body.fecha || new Date().toISOString().split('T')[0];
    const inicioDia = new Date(fecha + 'T00:00:00');
    const finDia = new Date(fecha + 'T23:59:59');

    const transacciones = await Transaccion.findAll({
      where: {
        createdAt: {
          [require('sequelize').Op.between]: [inicioDia, finDia]
        }
      }
    });

    const ingresos = transacciones
      .filter(t => t.tipo === 'ingreso')
      .reduce((sum, t) => sum + parseFloat(t.monto), 0);

    const gastos = transacciones
      .filter(t => t.tipo === 'gasto' && t.categoria !== 'Cierre')
      .reduce((sum, t) => sum + parseFloat(t.monto), 0);

    const balance = ingresos - gastos;

    const Pedido = require('../models/Pedido');
    const Mesa = require('../models/Mesa');
    
    const pedidosDia = await Pedido.findAll({
      where: {
        createdAt: {
          [require('sequelize').Op.between]: [inicioDia, finDia]
        }
      }
    });

    await Mesa.update({ estado: 'libre' }, { where: { estado: 'ocupada' } });

    req.io.emit('cierre-dia');

    res.json({
      fecha,
      ingresos,
      gastos,
      balance,
      pedidos: pedidosDia.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHistorial = async (req, res) => {
  try {
    const transacciones = await Transaccion.findAll({
      where: {
        categoria: 'Cierre'
      },
      order: [['createdAt', 'DESC']]
    });
    res.json(transacciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHistorialComandas = async (req, res) => {
  try {
    const Pedido = require('../models/Pedido');
    const Mesa = require('../models/Mesa');
    
    const pedidos = await Pedido.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    const mesas = await Mesa.findAll();
    const mesaMap = {};
    mesas.forEach(m => { mesaMap[m.id] = m.numero; });
    
    const porDia = {};
    pedidos.forEach(p => {
      const fecha = new Date(p.createdAt).toISOString().split('T')[0];
      if (!porDia[fecha]) {
        porDia[fecha] = { pedidos: [], total: 0, entregados: 0 };
      }
      porDia[fecha].pedidos.push({
        id: p.id,
        mesa: mesaMap[p.mesaId] || p.mesaId,
        total: p.total,
        estado: p.estado,
        tipoPago: p.tipoPago
      });
      porDia[fecha].total += parseFloat(p.total);
      if (p.estado === 'entregado') porDia[fecha].entregados++;
    });
    
    const historial = Object.entries(porDia).map(([fecha, data]) => ({
      fecha,
      pedidos: data.pedidos.length,
      total: data.total,
      entregados: data.entregados,
      detalle: data.pedidos
    })).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEstadoDia = async (req, res) => {
  try {
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    const transacciones = await Transaccion.findAll({
      where: {
        createdAt: { [Op.gte]: inicioDia }
      }
    });
    
    const tieneApertura = transacciones.some(t => t.categoria === 'Apertura');
    const tieneCierre = transacciones.some(t => t.categoria === 'Cierre');
    
    res.json({
      abierto: tieneApertura && !tieneCierre,
      tieneApertura,
      tieneCierre
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
