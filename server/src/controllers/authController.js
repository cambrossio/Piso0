const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const JWT_SECRET = process.env.JWT_SECRET || 'piso0_secret_key_2024';

const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const validarEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valido: false, error: 'Email inválido' };
  }
  
  const dominiosValidos = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'live.com', 'icloud.com', 'mail.com', 'aol.com'];
  const dominio = email.split('@')[1].toLowerCase();
  
  return { valido: true };
};

exports.register = async (req, res) => {
  try {
    const { email, password, nombre, telefono, direccion } = req.body;
    
    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' });
    }

    const validacion = validarEmail(email);
    if (!validacion.valido) {
      return res.status(400).json({ error: validacion.error });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (telefono && !/^[\d\s\+\-\(\)]{8,20}$/.test(telefono)) {
      return res.status(400).json({ error: 'Teléfono inválido' });
    }

    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const usuario = await Usuario.create({
      email,
      password,
      nombre,
      telefono: telefono || null,
      direccion: direccion || null,
      rol: 'cliente'
    });

    const token = generarToken(usuario);
    
    res.status(201).json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!usuario.password) {
      return res.status(401).json({ error: 'Usa login con Google' });
    }

    const esValido = await usuario.comparePassword(password);
    if (!esValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generarToken(usuario);

    res.json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.loginGoogle = async (req, res) => {
  try {
    const { googleId, email, nombre } = req.body;

    let usuario = await Usuario.findOne({ where: { googleId } });
    
    if (!usuario) {
      usuario = await Usuario.findOne({ where: { email } });
      if (usuario) {
        usuario.googleId = googleId;
        await usuario.save();
      } else {
        usuario = await Usuario.create({
          googleId,
          email,
          nombre,
          rol: 'cliente'
        });
      }
    }

    const token = generarToken(usuario);

    res.json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: ['id', 'email', 'nombre', 'telefono', 'direccion', 'rol']
    });
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { telefono, direccion, nombre } = req.body;
    
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (telefono !== undefined) {
      if (telefono && !/^[\d\s\+\-\(\)]{8,20}$/.test(telefono)) {
        return res.status(400).json({ error: 'Teléfono inválido' });
      }
      usuario.telefono = telefono;
    }

    if (direccion !== undefined) {
      usuario.direccion = direccion;
    }

    if (nombre !== undefined) {
      usuario.nombre = nombre;
    }

    await usuario.save();

    res.json({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      rol: usuario.rol
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
