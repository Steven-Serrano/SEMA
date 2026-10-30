const express = require('express');
const Usuario = require('../models/Usuario');
const Psicologo = require('../models/Psicologo');
const Cita = require('../models/Cita');
const Publicacion = require('../models/Publicacion');

const router = express.Router();

// GET /api/estadisticas - Datos reales para el Landing Page
router.get('/', async (req, res) => {
  try {
    // Contamos los documentos reales en MongoDB
    const totalUsuarios = await Usuario.countDocuments({ rol: 'usuario' });
    const totalPsicologos = await Psicologo.countDocuments({ estado: 'activo' });
    const totalCitas = await Cita.countDocuments();
    const totalPublicaciones = await Publicacion.countDocuments();

    res.json({
      usuarios: totalUsuarios,
      psicologos: totalPsicologos,
      citas: totalCitas,
      publicaciones: totalPublicaciones
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener las estadísticas' });
  }
});

module.exports = router;