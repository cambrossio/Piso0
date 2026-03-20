const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Config = sequelize.define('Config', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Config;
