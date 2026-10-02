const express = require('express');
const Notificacion = require('../models/Notificacion');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// GET /api/notificaciones - Obtener todas las notificaciones del usuario autenticado
router.get('/', verificarToken, async (req, res) => {
  try {
    const notificaciones = await Notificacion.find({ usuarioId: req.usuario.id })
      .sort({ fecha: -1 }); // Las más recientes primero

    res.json(notificaciones);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// PUT /api/notificaciones/:id/leida - Marcar una notificación como leída
router.put('/:id/leida', verificarToken, async (req, res) => {
  try {
    const notificacion = await Notificacion.findOneAndUpdate(
      { _id: req.params.id, usuarioId: req.usuario.id }, // Asegura que solo marque las suyas
      { leida: true },
      { new: true }
    );

    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    res.json({ mensaje: 'Notificación marcada como leída', data: notificacion });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/notificaciones/:id - Eliminar una notificación
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const eliminada = await Notificacion.findOneAndDelete({ 
      _id: req.params.id, 
      usuarioId: req.usuario.id 
    });

    if (!eliminada) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    res.json({ mensaje: 'Notificación eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar la notificación' });
  }
});

module.exports = router;