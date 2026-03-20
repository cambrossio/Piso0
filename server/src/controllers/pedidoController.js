const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');
const Transaccion = require('../models/Transaccion');
const Mesa = require('../models/Mesa');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

const mpClient = new Preference({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const mpPayment = new Payment({
  accessToken: process.env.MP_ACCESS_TOKEN
});

exports.getAll = async (req, res) => {
  try {
    const { estado, fecha } = req.query;
    const where = {};
    
    if (estado) where.estado = estado;

    const pedidos = await Pedido.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    const numeroMesa = pedido.mesaId === 'DELIVERY' ? '🚗 Delivery' : (await Mesa.findByPk(pedido.mesaId))?.numero;
    res.json({ ...pedido.toJSON(), numeroMesa });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getByMesa = async (req, res) => {
  try {
    const mesa = await Mesa.findOne({ where: { codigoQR: req.params.codigoQR } });
    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    const pedidos = await Pedido.findAll({
      where: { mesaId: mesa.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { mesaId, items, clienteId, clienteNombre } = req.body;

    const mesa = await Mesa.findByPk(mesaId);
    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    let total = 0;
    const itemsConPrecio = [];

    for (const item of items) {
      const producto = await Producto.findByPk(item.productoId);
      if (!producto) {
        return res.status(404).json({ error: `Producto ${item.productoId} no encontrado` });
      }
      if (!producto.disponible) {
        return res.status(400).json({ error: `El producto ${producto.nombre} no está disponible` });
      }
      if (producto.stock < item.cantidad) {
        return res.status(400).json({ error: `Stock insuficiente para ${producto.nombre}` });
      }

      total += parseFloat(producto.precio) * item.cantidad;
      itemsConPrecio.push({
        productoId: producto.id,
        productoNombre: producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
        notas: item.notas
      });

      await producto.update({
        stock: producto.stock - item.cantidad
      });
    }

    const pedido = await Pedido.create({
      mesaId,
      clienteId,
      items: itemsConPrecio,
      total,
      estado: 'pendiente'
    });

    await mesa.update({ estado: 'ocupada' });

    const pedidoConMesa = {
      ...pedido.toJSON(),
      numeroMesa: mesa.numero
    };

    req.io.to('admin').emit('nuevo-pedido', pedidoConMesa);

    res.status(201).json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.agregarItems = async (req, res) => {
  try {
    const { items } = req.body;
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden agregar items a pedidos pendientes' });
    }

    const productos = await Producto.findAll({
      where: { id: items.map(i => i.productoId) }
    });

    const productoMap = {};
    productos.forEach(p => { productoMap[p.id] = p; });

    let totalAdicional = 0;
    const nuevosItems = [];

    for (const item of items) {
      const producto = productoMap[item.productoId];
      if (!producto) {
        return res.status(404).json({ error: `Producto ${item.productoId} no encontrado` });
      }
      if (!producto.disponible) {
        return res.status(400).json({ error: `El producto ${producto.nombre} no está disponible` });
      }
      if (producto.stock < item.cantidad) {
        return res.status(400).json({ error: `Stock insuficiente para ${producto.nombre}` });
      }

      totalAdicional += parseFloat(producto.precio) * item.cantidad;
      nuevosItems.push({
        productoId: producto.id,
        productoNombre: producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
        notas: item.notas || ''
      });

      await producto.update({
        stock: producto.stock - item.cantidad
      });
    }

    const itemsActuales = pedido.items || [];
    const todosItems = [...itemsActuales, ...nuevosItems];
    const totalNuevo = parseFloat(pedido.total) + totalAdicional;

    await pedido.update({
      items: todosItems,
      total: totalNuevo
    });

    const numeroMesa = pedido.mesaId === 'DELIVERY' ? '🚗 Delivery' : (await Mesa.findByPk(pedido.mesaId))?.numero;

    req.io.to('admin').emit('pedido-actualizado', {
      ...pedido.toJSON(),
      numeroMesa
    });
    if (pedido.mesaId !== 'DELIVERY') {
      req.io.to(`mesa-${pedido.mesaId}`).emit('pedido-actualizado', {
        ...pedido.toJSON(),
        numeroMesa
      });
    }

    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateEstado = async (req, res) => {
  try {
    const { estado, motivoCancelacion } = req.body;
    const pedido = await Pedido.findByPk(req.params.id);
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const updateData = { estado };
    if (estado === 'cancelado' && motivoCancelacion) {
      updateData.motivoCancelacion = motivoCancelacion;
    }

    await pedido.update(updateData);

    if (estado === 'entregado' && pedido.tipoPago && !pedido.transaccionCreada) {
      await Transaccion.create({
        tipo: 'ingreso',
        categoria: 'Pedidos',
        monto: pedido.total,
        descripcion: `Pedido #${pedido.id.slice(0, 8)} - ${pedido.tipoPago}`,
        pedidoId: pedido.id
      });
      await pedido.update({ transaccionCreada: true });
    }

    req.io.to('admin').emit('pedido-actualizado', {
      ...pedido.toJSON(),
      numeroMesa: pedido.mesaId === 'DELIVERY' ? '🚗 Delivery' : (await Mesa.findByPk(pedido.mesaId))?.numero
    });
    if (pedido.mesaId !== 'DELIVERY') {
      req.io.to(`mesa-${pedido.mesaId}`).emit('pedido-actualizado', {
        ...pedido.toJSON(),
        numeroMesa: (await Mesa.findByPk(pedido.mesaId))?.numero
      });
    }

    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.pagar = async (req, res) => {
  try {
    const { tipoPago } = req.body;
    const pedido = await Pedido.findByPk(req.params.id);
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.estado === 'cancelado') {
      return res.status(400).json({ error: 'El pedido está cancelado' });
    }

    await pedido.update({ tipoPago, estado: 'pagado' });

    await Transaccion.create({
      tipo: 'ingreso',
      categoria: 'Pedidos',
      monto: pedido.total,
      descripcion: `Pedido #${pedido.id.slice(0, 8)} - ${tipoPago}`,
      pedidoId: pedido.id
    });

    await pedido.update({ transaccionCreada: true });

    const pedidoActualizado = await Pedido.findByPk(pedido.id);

    req.io.to('admin').emit('pedido-actualizado', {
      ...pedidoActualizado.toJSON(),
      numeroMesa: pedido.mesaId === 'DELIVERY' ? '🚗 Delivery' : (await Mesa.findByPk(pedido.mesaId))?.numero
    });
    if (pedido.mesaId !== 'DELIVERY') {
      req.io.to(`mesa-${pedido.mesaId}`).emit('pedido-actualizado', {
        ...pedidoActualizado.toJSON(),
        numeroMesa: (await Mesa.findByPk(pedido.mesaId))?.numero
      });
    }

    res.json(pedidoActualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearPreferenciaMP = async (req, res) => {
  try {
    const { pedidoId } = req.body;
    const pedido = await Pedido.findByPk(pedidoId);
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.estado === 'cancelado') {
      return res.status(400).json({ error: 'El pedido está cancelado' });
    }

    const items = pedido.items.map(item => ({
      title: item.productoNombre,
      unit_price: parseFloat(item.precioUnitario),
      quantity: item.cantidad
    }));

    const preference = {
      items,
      external_reference: pedido.id,
      notification_url: `${process.env.MP_NOTIFICATION_URL || 'http://localhost:8000'}/api/pedidos/webhook`,
      back_urls: {
        success: `${process.env.CLIENT_URL || 'http://localhost:5173'}/pago-exitoso?pedidoId=${pedido.id}`,
        failure: `${process.env.CLIENT_URL || 'http://localhost:5173'}/pago-fallido?pedidoId=${pedido.id}`,
        pending: `${process.env.CLIENT_URL || 'http://localhost:5173'}/pago-pendiente?pedidoId=${pedido.id}`
      }
    };

    const result = await mpClient.create({ body: preference });
    
    res.json({ initPoint: result.init_point, preferenceId: result.id });
  } catch (error) {
    console.error('Error creando preferencia MP:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.webhookMP = async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const paymentId = data.id;
      const payment = await mpPayment.get({ id: paymentId });
      
      if (payment.status === 'approved') {
        const pedidoId = payment.external_reference;
        const pedido = await Pedido.findByPk(pedidoId);
        
        if (pedido && pedido.estado !== 'pagado') {
          await pedido.update({ 
            estado: 'pagado',
            tipoPago: 'mercadopago',
            paymentId: paymentId
          });
          
          await Transaccion.create({
            tipo: 'ingreso',
            categoria: 'Pedidos',
            monto: pedido.total,
            descripcion: `Pedido #${pedido.id.slice(0, 8)} - MercadoPago`,
            pedidoId: pedido.id
          });

          req.io.to('admin').emit('pedido-actualizado', {
            ...pedido.toJSON(),
            numeroMesa: pedido.mesaId === 'DELIVERY' ? '🚗 Delivery' : (await Mesa.findByPk(pedido.mesaId))?.numero
          });
          if (pedido.mesaId !== 'DELIVERY') {
            req.io.to(`mesa-${pedido.mesaId}`).emit('pedido-actualizado', {
              ...pedido.toJSON(),
              numeroMesa: (await Mesa.findByPk(pedido.mesaId))?.numero
            });
          }
        }
      }
    }
    
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Error en webhook MP:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.cancelar = async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden cancelar pedidos pendientes' });
    }

    for (const item of pedido.items) {
      const producto = await Producto.findByPk(item.productoId);
      if (producto) {
        await producto.update({
          stock: producto.stock + item.cantidad
        });
      }
    }

    await pedido.update({ estado: 'cancelado' });

    const otrosPedidosActivos = await Pedido.findAll({
      where: {
        mesaId: pedido.mesaId,
        estado: { [require('sequelize').Op.notIn]: ['cancelado', 'pagado'] }
      }
    });

    if (otrosPedidosActivos.length === 0 && pedido.mesaId !== 'DELIVERY') {
      const mesa = await Mesa.findByPk(pedido.mesaId);
      if (mesa) {
        await mesa.update({ estado: 'disponible' });
      }
    }

    req.io.to('admin').emit('pedido-actualizado', pedido);
    if (pedido.mesaId !== 'DELIVERY') {
      req.io.to(`mesa-${pedido.mesaId}`).emit('pedido-actualizado', pedido);
    }

    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createDelivery = async (req, res) => {
  try {
    const { items, deliveryInfo, tipoPago, total, crearTransaccion, estado } = req.body;

    const clienteId = req.body.clienteId || (req.user ? req.user.id : null) || `guest-${Date.now()}`;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No hay productos en el pedido' });
    }

    const pedidoData = {
      mesaId: 'DELIVERY',
      clienteId: clienteId || `guest-${Date.now()}`,
      items: items.map(item => ({
        productoId: item.productoId || 'unknown',
        productoNombre: item.productoNombre || item.nombre,
        cantidad: item.cantidad || 1,
        precioUnitario: item.precioUnitario || item.precio || 0
      })),
      total: parseFloat(total) || 0,
      estado: estado || 'pendiente',
      tipoPago: tipoPago,
      deliveryInfo: deliveryInfo || {},
      tipoPedido: 'delivery'
    };

    const pedido = await Pedido.create(pedidoData);

    if (crearTransaccion) {
      try {
        await Transaccion.create({
          tipo: 'ingreso',
          categoria: 'Delivery',
          monto: parseFloat(total) || 0,
          descripcion: `Delivery #${pedido.id.slice(0, 8)} - ${(deliveryInfo && deliveryInfo.nombre) ? deliveryInfo.nombre : 'Cliente'} - MercadoPago`,
          pedidoId: pedido.id
        });
        await pedido.update({ transaccionCreada: true });
      } catch (e) {
        console.error('Error creando transacción:', e);
      }
    }

    req.io.to('admin').emit('nuevo-pedido', {
      ...pedido.toJSON(),
      numeroMesa: '🚗 Delivery'
    });

    res.status(201).json(pedido);
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.crearPreferenciaMPDelivery = async (req, res) => {
  try {
    const { items, deliveryInfo, total, pedidoId } = req.body;

    const preferenceItems = items.map(item => ({
      title: item.productoNombre,
      unit_price: parseFloat(item.precioUnitario),
      quantity: item.cantidad
    }));

    const externalRef = pedidoId ? `DELIVERY-${pedidoId}` : `DELIVERY-${Date.now()}`;

    const preference = {
      items: preferenceItems,
      external_reference: externalRef,
      notification_url: `${process.env.MP_NOTIFICATION_URL || 'http://localhost:8000'}/api/pedidos/webhook`,
      back_urls: {
        success: `${process.env.CLIENT_URL || 'http://localhost:5173'}/delivery-callback`,
        failure: `${process.env.CLIENT_URL || 'http://localhost:5173'}/delivery-callback?status=failed`,
        pending: `${process.env.CLIENT_URL || 'http://localhost:5173'}/delivery-callback?status=pending`
      }
    };

    const result = await mpClient.create({ body: preference });
    
    res.json({ initPoint: result.init_point, preferenceId: result.id });
  } catch (error) {
    console.error('Error creando preferencia MP delivery:', error);
    res.status(500).json({ error: error.message });
  }
};
