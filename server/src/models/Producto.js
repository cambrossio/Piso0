const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Producto = sequelize.define('Producto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  categoria: {
    type: DataTypes.ENUM('bebida', 'comida', 'postre', 'otro'),
    defaultValue: 'otro'
  },
  imagen: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  stockMinimo: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  disponible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = Producto;
