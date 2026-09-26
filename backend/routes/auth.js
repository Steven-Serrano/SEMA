// backend/routes/auth.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const router = express.Router();

// POST /api/auth/registro — crear una cuenta nueva en SEMA
router.post('/registro', async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      correo,
      contraseña,
      fecha_nacimiento,
      tipo_usuario,
      rol
    } = req.body;

    // Verificar que el correo no exista
    const existe = await Usuario.findOne({ correo });

    if (existe) {
      return res.status(400).json({
        error: 'El correo ya está registrado'
      });
    }

    // Encriptar la contraseña antes de guardarla
    const hash = await bcrypt.hash(contraseña, 10);

    // Crear el usuario de SEMA
    const usuario = await Usuario.create({
      nombre,
      apellido,
      correo,
      contraseña: hash,
      fecha_nacimiento,
      tipo_usuario,
      rol
    });

    res.status(201).json({
      mensaje: 'Usuario creado correctamente en SEMA',
      id: usuario._id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      tipo_usuario: usuario.tipo_usuario,
      rol: usuario.rol
    });

  } catch (err) {
    res.status(400).json({
      error: err.message
    });
  }
});

// POST /api/auth/login — iniciar sesión en SEMA
router.post('/login', async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    // Buscar el usuario por correo
    const usuario = await Usuario.findOne({ correo });

    if (!usuario) {
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos'
      });
    }

    // Comparar la contraseña recibida con el hash guardado
    const valida = await bcrypt.compare(
      contraseña,
      usuario.contraseña
    );

    if (!valida) {
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos'
      });
    }

    // Crear el token JWT
    const token = jwt.sign(
      {
        id: usuario._id,
        correo: usuario.correo,
        rol: usuario.rol
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '24h'
      }
    );

    res.json({
      token,
      nombre: usuario.nombre,
      correo: usuario.correo,
      tipo_usuario: usuario.tipo_usuario,
      rol: usuario.rol
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;