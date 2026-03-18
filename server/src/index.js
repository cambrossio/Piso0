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

app.use(cors());
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

sequelize.sync({ force: false }).then(async () => {
  console.log('Base de datos sincronizada');
  
  const Pedido = require('./models/Pedido');
  
  await sequelize.query('ALTER TABLE Pedidos ADD COLUMN transaccionCreada BOOLEAN DEFAULT 0').catch(() => {});
  await sequelize.query('ALTER TABLE Pedidos ADD COLUMN deliveryInfo TEXT').catch(() => {});
  await sequelize.query('ALTER TABLE Pedidos ADD COLUMN tipoPedido TEXT').catch(() => {});
  await sequelize.query('ALTER TABLE Usuarios ADD COLUMN telefono TEXT').catch(() => {});
  await sequelize.query('ALTER TABLE Usuarios ADD COLUMN direccion TEXT').catch(() => {});
  await sequelize.query('ALTER TABLE Usuarios ADD COLUMN verificado BOOLEAN DEFAULT 0').catch(() => {});
  
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

  server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
}).catch(err => {
  console.error('Error al sincronizar base de datos:', err);
});
