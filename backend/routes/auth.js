const express = require('express');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const router = express.Router();

// ==========================================
// POST /api/auth/registro
// ==========================================
router.post('/registro', async (req, res) => {
  try {
    const { 
      nombre, 
      documento, 
      email, 
      password, 
      telefono, 
      ciudad, 
      fechaNacimiento, 
      genero,
      numeroFicha,
      programaFormacion,
      edad,
      rol = 'usuario'
    } = req.body;

    if (!nombre || !documento || !email || !password || !numeroFicha || !programaFormacion) {
      return res.status(400).json({ 
        error: 'Campos obligatorios: nombre, documento, email, password, numeroFicha, programaFormacion' 
      });
    }

    const emailExistente = await Usuario.findOne({ email });
    if (emailExistente) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    const documentoExistente = await Usuario.findOne({ documento });
    if (documentoExistente) {
      return res.status(400).json({ error: 'El número de documento ya está registrado' });
    }

    const usuario = new Usuario({
      nombre,
      documento,
      email,
      password,
      telefono,
      ciudad,
      fechaNacimiento,
      genero,
      numeroFicha,
      programaFormacion,
      edad,
      rol
    });

    await usuario.save();

    const token = jwt.sign(
      { id: usuario._id, tipo: rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// POST /api/auth/login
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'El correo y la contraseña son obligatorios' });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const esValida = await usuario.comparePassword(password);
    if (!esValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // 🔑 VALIDACIÓN DE BANEO
    if (usuario.activo === false) {
      return res.status(403).json({ 
        error: 'Tu cuenta ha sido suspendida por un administrador. Contacta a Bienestar SENA.' 
      });
    }

    const token = jwt.sign(
      { id: usuario._id, tipo: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      tipo: usuario.rol
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;