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
const backupRoutes = require('./routes/backup');

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
app.use('/api/backup', backupRoutes);

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
    console.log('Starting database sync...');
    await sequelize.sync({ force: false });
    console.log('Base de datos sincronizada');
    
    const Pedido = require('./models/Pedido');
    
    console.log('Checking Pedidos table schema...');
    const [cols] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Pedidos' 
      AND column_name IN ('mesaId', 'clienteId')
    `);
    console.log('Current columns:', JSON.stringify(cols));
    
    const needsMigration = cols.some(c => c.data_type === 'uuid');
    
    if (needsMigration) {
      console.log('Migrating Pedidos table from UUID to TEXT...');
      
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "Pedidos_new" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "mesaId" TEXT NOT NULL,
          "clienteId" TEXT NOT NULL,
          items JSONB NOT NULL DEFAULT '[]',
          estado TEXT DEFAULT 'pendiente',
          "tipoPago" TEXT,
          total DECIMAL(10,2) NOT NULL DEFAULT 0,
          "motivoCancelacion" TEXT,
          "transaccionCreada" BOOLEAN DEFAULT false,
          "deliveryInfo" TEXT,
          "tipoPedido" TEXT,
          "paymentId" TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Created Pedidos_new table');
      
      await sequelize.query(`
        INSERT INTO "Pedidos_new" 
        SELECT 
          id, 
          "mesaId"::TEXT, 
          "clienteId"::TEXT, 
          items, 
          estado, 
          "tipoPago", 
          total, 
          "motivoCancelacion", 
          "transaccionCreada", 
          "deliveryInfo"::TEXT, 
          "tipoPedido", 
          "paymentId",
          "createdAt", 
          "updatedAt"
        FROM "Pedidos"
      `);
      console.log('Copied data to Pedidos_new');
      
      await sequelize.query('ALTER TABLE "Pedidos" RENAME TO "Pedidos_backup"');
      await sequelize.query('ALTER TABLE "Pedidos_new" RENAME TO "Pedidos"');
      console.log('Swapped tables - migration complete!');
    } else {
      console.log('mesaId/clienteId already TEXT, skipping migration');
    }
    
    try {
      await sequelize.query('ALTER TABLE "Pedidos" ADD COLUMN IF NOT EXISTS "transaccionCreada" BOOLEAN DEFAULT false');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE "Pedidos" ADD COLUMN IF NOT EXISTS "deliveryInfo" TEXT');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE "Pedidos" ADD COLUMN IF NOT EXISTS "tipoPedido" TEXT');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE "Pedidos" ADD COLUMN IF NOT EXISTS "paymentId" TEXT');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE "Usuarios" ADD COLUMN IF NOT EXISTS "telefono" TEXT');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE "Usuarios" ADD COLUMN IF NOT EXISTS "direccion" TEXT');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE "Usuarios" ADD COLUMN IF NOT EXISTS "verificado" BOOLEAN DEFAULT false');
    } catch (e) {}
    
    console.log('Checking Transaccions table schema...');
    const [transCols] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Transaccions' 
      AND column_name = 'pedidoId'
    `);
    console.log('Transaccions pedidoId column:', JSON.stringify(transCols));
    
    if (transCols.length > 0 && transCols[0].data_type === 'uuid') {
      console.log('Migrating Transaccions pedidoId from UUID to TEXT...');
      try {
        await sequelize.query('ALTER TABLE "Transaccions" DROP CONSTRAINT IF EXISTS "fk_pedido"');
      } catch (e) {
        console.log('No fk_pedido constraint to drop:', e.message);
      }
      try {
        await sequelize.query('ALTER TABLE "Transaccions" ADD COLUMN "pedidoId_text" TEXT');
        await sequelize.query('UPDATE "Transaccions" SET "pedidoId_text" = "pedidoId"::TEXT WHERE "pedidoId" IS NOT NULL');
        await sequelize.query('ALTER TABLE "Transaccions" DROP COLUMN "pedidoId"');
        await sequelize.query('ALTER TABLE "Transaccions" RENAME COLUMN "pedidoId_text" TO "pedidoId"');
        console.log('Transaccions pedidoId migrated to TEXT');
      } catch (e) {
        console.log('Transaccions migration error:', e.message);
      }
    }
    
    try {
      await sequelize.query("ALTER TYPE enum_Pedidos_estado ADD VALUE IF NOT EXISTS 'enviando'");
      console.log('Added enviando to Pedidos estado enum');
    } catch (e) {
      console.log('Enum enviando may already exist:', e.message);
    }
    
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
