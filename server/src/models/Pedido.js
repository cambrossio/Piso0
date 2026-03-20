const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Pedido = sequelize.define('Pedido', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  mesaId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  clienteId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'preparando', 'listo', 'entregado', 'cancelado', 'pagado'),
    defaultValue: 'pendiente'
  },
  tipoPago: {
    type: DataTypes.STRING,
    allowNull: true
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  motivoCancelacion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transaccionCreada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Pedido;
