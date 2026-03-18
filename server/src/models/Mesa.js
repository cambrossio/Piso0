const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Mesa = sequelize.define('Mesa', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  numero: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  codigoQR: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  capacidad: {
    type: DataTypes.INTEGER,
    defaultValue: 4
  },
  estado: {
    type: DataTypes.ENUM('libre', 'ocupada', 'reservada'),
    defaultValue: 'libre'
  }
});

module.exports = Mesa;
