const express = require('express');
const EstadoEmocional = require('../models/EstadoEmocional');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// POST /api/estados-emocionales
router.post('/', verificarToken, async (req, res) => {
  try {
    const { estado, descripcion } = req.body;
    
    const nuevoEstado = await EstadoEmocional.create({
      usuarioId: req.usuario.id,
      estado,
      descripcion
    });

    res.status(201).json({
      mensaje: 'Estado emocional registrado correctamente',
      data: nuevoEstado
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/estados-emocionales
router.get('/', verificarToken, async (req, res) => {
  try {
    let targetUserId = req.usuario.id;
    const rol = req.usuario.rol || req.usuario.tipo;
    
    // 🔑 Si es psicólogo y pide un paciente específico
    if (rol === 'psicologo' && req.query.paciente) {
      targetUserId = req.query.paciente;
    }

    const estados = await EstadoEmocional.find({ usuarioId: targetUserId })
      .sort({ fecha: -1 });
    res.json(estados);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estados emocionales' });
  }
});

module.exports = router;