const express = require('express');
const Usuario = require('../models/Usuario');
const Cita = require('../models/Cita');
const Chat = require('../models/Chat');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// Middleware para verificar que sea administrador
const verificarAdmin = (req, res, next) => {
  if (req.usuario.tipo !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado — se requiere rol administrador' });
  }
  next();
};

// GET /api/admin/estadisticas - Obtener estadísticas globales
router.get('/estadisticas', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const totalUsuarios = await Usuario.countDocuments({ rol: 'usuario' });
    const totalPsicologos = await Usuario.countDocuments({ rol: 'psicologo' });
    const totalAdministradores = await Usuario.countDocuments({ rol: 'administrador' });
    const totalCitas = await Cita.countDocuments();
    const totalChats = await Chat.countDocuments();

    res.json({
      usuarios: totalUsuarios,
      psicologos: totalPsicologos,
      administradores: totalAdministradores,
      citas: totalCitas,
      chats: totalChats
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// GET /api/admin/usuarios - Obtener todos los usuarios
router.get('/usuarios', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password').sort({ createdAt: -1 });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// PUT /api/admin/usuarios/:id - Actualizar rol o estado de usuario
router.put('/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { rol, activo } = req.body;
    const usuario = await Usuario.findById(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (rol) usuario.rol = rol;
    if (activo !== undefined) usuario.activo = activo;

    await usuario.save();

    res.json({ mensaje: 'Usuario actualizado', data: usuario });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/admin/usuarios/:id - Eliminar usuario
router.delete('/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// GET /api/admin/psicologos-pendientes - Obtener psicólogos pendientes de aprobación
router.get('/psicologos-pendientes', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const psicologos = await Usuario.find({ 
      rol: 'psicologo', 
      activo: false 
    }).select('-password');
    res.json(psicologos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener psicólogos pendientes' });
  }
});

// PUT /api/admin/psicologos/:id/aprobar - Aprobar psicólogo
router.put('/psicologos/:id/aprobar', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const psicologo = await Usuario.findById(req.params.id);
    
    if (!psicologo || psicologo.rol !== 'psicologo') {
      return res.status(404).json({ error: 'Psicólogo no encontrado' });
    }

    psicologo.activo = true;
    await psicologo.save();

    res.json({ mensaje: 'Psicólogo aprobado correctamente', data: psicologo });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;