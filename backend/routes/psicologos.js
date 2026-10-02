const express = require('express');
const Psicologo = require('../models/Psicologo');
const verificarToken = require('../middleware/auth');
const verificarAdmin = require('../middleware/admin');

const router = express.Router();

// GET /api/psicologos - Obtener todos los psicólogos activos
router.get('/', async (req, res) => {
  try {
    const psicologos = await Psicologo.find({ estado: 'activo' }).select('-password');
    res.json(psicologos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener psicólogos' });
  }
});

// POST /api/psicologos - Crear psicólogo (Solo super_administrador)
router.post('/', [verificarToken, verificarAdmin], async (req, res) => {
  try {
    const { nombre, email, password, especialidad, telefono } = req.body;
    
    const existe = await Psicologo.findOne({ email });
    if (existe) return res.status(400).json({ error: 'El correo ya está registrado' });

    // El modelo encripta la contraseña automáticamente
    const nuevoPsicologo = await Psicologo.create({
      nombre, email, password, especialidad, telefono
    });

    res.status(201).json({
      mensaje: 'Psicólogo registrado correctamente',
      id: nuevoPsicologo._id,
      nombre: nuevoPsicologo.nombre
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;