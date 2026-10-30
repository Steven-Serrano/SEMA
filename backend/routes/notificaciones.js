const express = require('express');
const Notificacion = require('../models/Notificacion');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// GET /api/notificaciones - (Para Estudiantes)
router.get('/', verificarToken, async (req, res) => {
  try {
    const notificaciones = await Notificacion.find({ usuarioId: req.usuario.id }).sort({ fecha: -1 });
    res.json(notificaciones);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// 🔑 GET /api/notificaciones/psicologo - (Para Psicólogos)
router.get('/psicologo', verificarToken, async (req, res) => {
  try {
    const notificaciones = await Notificacion.find({ psicologoId: req.usuario.id }).sort({ fecha: -1 });
    res.json(notificaciones);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// PUT /api/notificaciones/:id/leida - Marcar como leída
router.put('/:id/leida', verificarToken, async (req, res) => {
  try {
    const notificacion = await Notificacion.findOneAndUpdate(
      { 
        _id: req.params.id,
        $or: [
          { usuarioId: req.usuario.id },
          { psicologoId: req.usuario.id }
        ]
      },
      { leida: true },
      { new: true }
    );
    if (!notificacion) return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json({ mensaje: 'Leída', data: notificacion });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

// DELETE /api/notificaciones/:id - Eliminar
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const eliminada = await Notificacion.findOneAndDelete({ 
      _id: req.params.id,
      $or: [
        { usuarioId: req.usuario.id },
        { psicologoId: req.usuario.id }
      ]
    });
    if (!eliminada) return res.status(404).json({ error: 'No encontrada' });
    res.json({ mensaje: 'Eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

module.exports = router;