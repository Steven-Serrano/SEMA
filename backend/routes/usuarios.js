const express = require('express');
const Usuario = require('../models/Usuario');
const verificarToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');

const router = express.Router();

// ==========================================
// 1. RUTAS ESPECÍFICAS (PRIMERO)
// ==========================================

// GET /api/usuarios - Obtener todos los usuarios
router.get('/', verificarToken, async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password');
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// GET /api/usuarios/perfil - Obtener perfil del usuario
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-password');
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
});

// PUT /api/usuarios/perfil - Actualizar información completa
router.put('/perfil', verificarToken, async (req, res) => {
  try {
    const { 
      nombre, 
      documento, 
      email, 
      telefono, 
      ciudad, 
      fechaNacimiento, 
      genero, 
      biografia,
      numeroFicha,
      programaFormacion
    } = req.body;
    
    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar campos
    if (nombre) usuario.nombre = nombre;
    if (documento) usuario.documento = documento;
    if (email) usuario.email = email;
    if (telefono) usuario.telefono = telefono;
    if (ciudad) usuario.ciudad = ciudad;
    if (fechaNacimiento) usuario.fechaNacimiento = fechaNacimiento;
    if (genero) usuario.genero = genero;
    if (biografia) usuario.biografia = biografia;
    if (numeroFicha) usuario.numeroFicha = numeroFicha;
    if (programaFormacion) usuario.programaFormacion = programaFormacion;

    await usuario.save();

    const usuarioRespuesta = usuario.toObject();
    delete usuarioRespuesta.password;

    res.json({
      mensaje: 'Información actualizada correctamente',
      data: usuarioRespuesta
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Este documento o correo ya está en uso' });
    }
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/usuarios/subir-foto - Subir foto de perfil
router.put('/subir-foto', verificarToken, upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha seleccionado ninguna imagen' });
    }

    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Guardar ruta de la imagen (relativa para servir desde el servidor)
    usuario.fotoPerfil = `/uploads/${req.file.filename}`;
    await usuario.save();

    res.json({
      mensaje: 'Foto actualizada correctamente',
      fotoPerfil: usuario.fotoPerfil
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/usuarios/cambiar-password
router.put('/cambiar-password', verificarToken, async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;

    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({ error: 'Ambas contraseñas son requeridas' });
    }

    if (passwordNueva.length < 6) {
      return res.status(400).json({ error: 'Mínimo 6 caracteres' });
    }

    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const esValida = await usuario.comparePassword(passwordActual);
    if (!esValida) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    usuario.password = passwordNueva;
    await usuario.save();

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 2. RUTAS DINÁMICAS (AL FINAL)
// ==========================================

// GET /api/usuarios/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password');
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

// PUT /api/usuarios/:id
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!usuarioActualizado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuarioActualizado);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Documento o correo ya existe' });
    }
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/usuarios/:id
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const usuarioEliminado = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuarioEliminado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});

module.exports = router;