const Producto = require('../models/Producto');

exports.getAll = async (req, res) => {
  try {
    const { categoria, disponible } = req.query;
    const where = {};
    
    if (categoria) where.categoria = categoria;
    if (disponible !== undefined) where.disponible = disponible === 'true';

    const productos = await Producto.findAll({
      where,
      order: [['nombre', 'ASC']]
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria, imagen, stock, stockMinimo } = req.body;
    
    const producto = await Producto.create({
      nombre,
      descripcion,
      precio,
      categoria,
      imagen,
      stock: stock || 0,
      stockMinimo: stockMinimo || 5,
      disponible: true
    });

    res.status(201).json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const { nombre, descripcion, precio, categoria, imagen, stock, stockMinimo, disponible } = req.body;

    await producto.update({
      nombre: nombre || producto.nombre,
      descripcion: descripcion !== undefined ? descripcion : producto.descripcion,
      precio: precio || producto.precio,
      categoria: categoria || producto.categoria,
      imagen: imagen !== undefined ? imagen : producto.imagen,
      stock: stock !== undefined ? stock : producto.stock,
      stockMinimo: stockMinimo !== undefined ? stockMinimo : producto.stockMinimo,
      disponible: disponible !== undefined ? disponible : producto.disponible
    });

    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await producto.destroy();
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      where: sequelize.where(
        sequelize.col('stock'),
        { [sequelize.Sequelize.Op.lte]: sequelize.col('stockMinimo') }
      )
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
