const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const sequelize = require('./database');

const authRoutes = require('./routes/auth');
const productoRoutes = require('./routes/productos');
const mesaRoutes = require('./routes/mesas');
const pedidoRoutes = require('./routes/pedidos');
const transaccionRoutes = require('./routes/transacciones');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/mesas', mesaRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/transacciones', transaccionRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('join-admin', () => {
    socket.join('admin');
    console.log('Admin unido a la sala');
  });

  socket.on('join-mesa', (mesaId) => {
    socket.join(`mesa-${mesaId}`);
    console.log(`Cliente unido a la sala de mesa: ${mesaId}`);
  });

  socket.on('solicitar-mozo', (data) => {
    io.to('admin').emit('mozo-solicitado', data);
  });

  socket.on('pedir-cuenta', (data) => {
    io.to('admin').emit('cuenta-solicitada', data);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 8000;

const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('Base de datos sincronizada');
    
    const Pedido = require('./models/Pedido');
    const { DataTypes } = require('sequelize');
    
    try {
      await sequelize.query('ALTER TABLE "Pedidos" ADD COLUMN "transaccionCreada" BOOLEAN DEFAULT false');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE "Pedidos" ADD COLUMN "deliveryInfo" TEXT');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE "Pedidos" ADD COLUMN "tipoPedido" TEXT');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE "Usuarios" ADD COLUMN "telefono" TEXT');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE "Usuarios" ADD COLUMN "direccion" TEXT');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE "Usuarios" ADD COLUMN "verificado" BOOLEAN DEFAULT false');
    } catch (e) {}
    
    const Usuario = require('./models/Usuario');
    const adminExists = await Usuario.findOne({ where: { email: 'admin@piso0.com' } });
    
    if (!adminExists) {
      await Usuario.create({
        email: 'admin@piso0.com',
        password: 'admin123',
        nombre: 'Administrador',
        rol: 'admin'
      });
      console.log('Usuario admin creado: admin@piso0.com / admin123');
    }

    return true;
  } catch (err) {
    console.error('Error al sincronizar base de datos:', err);
    return false;
  }
};

syncDatabase().then(success => {
  if (success) {
    server.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  }
});
