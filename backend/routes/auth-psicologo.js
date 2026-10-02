const express = require('express');
const jwt = require('jsonwebtoken');
const Psicologo = require('../models/Psicologo');

const router = express.Router();

// POST /api/auth-psicologo/login - Login exclusivo para psicólogos
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const psicologo = await Psicologo.findOne({ email });
    if (!psicologo) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    // Verificar que el psicólogo esté activo
    if (psicologo.estado !== 'activo') {
      return res.status(403).json({ error: 'Tu cuenta está inactiva. Contacta al administrador.' });
    }

    // Comparar contraseña
    const valida = await psicologo.comparePassword(password);
    if (!valida) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    // Crear token JWT
    // IMPORTANTE: Incluimos 'tipo: psicologo' para que el sistema sepa quién está enviando mensajes
    const token = jwt.sign(
      { 
        id: psicologo._id, 
        email: psicologo.email, 
        tipo: 'psicologo' // <-- Esto es clave para el chat
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      nombre: psicologo.nombre,
      email: psicologo.email,
      especialidad: psicologo.especialidad,
      tipo: 'psicologo' // ✅ ESTO ES CRUCIAL
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;