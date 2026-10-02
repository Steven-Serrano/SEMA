const express = require('express');
const EstadoEmocional = require('../models/EstadoEmocional');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// POST /api/estados-emocionales - Registrar un nuevo estado
router.post('/', verificarToken, async (req, res) => {
  try {
    const { estado, descripcion } = req.body;
    
    // req.usuario.id viene del middleware verificarToken
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

// GET /api/estados-emocionales - Obtener los estados del usuario autenticado
router.get('/', verificarToken, async (req, res) => {
  try {
    const estados = await EstadoEmocional.find({ usuarioId: req.usuario.id })
      .sort({ fecha: -1 }); // Ordenar del más reciente al más antiguo
    res.json(estados);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estados emocionales' });
  }
});

module.exports = router;