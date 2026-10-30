const express = require('express');
const jwt = require('jsonwebtoken');
const AdministradorSENA = require('../models/AdministradorSENA');
const SuperAdministrador = require('../models/SuperAdministrador');

const router = express.Router();

// POST /api/auth-admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });

    let usuarioAdmin = await AdministradorSENA.findOne({ email });
    let rol = 'administrador_sena';

    if (!usuarioAdmin) {
      usuarioAdmin = await SuperAdministrador.findOne({ email });
      rol = 'super_administrador';
    }

    if (!usuarioAdmin) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const esValida = await usuarioAdmin.comparePassword(password);
    if (!esValida) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { id: usuarioAdmin._id, tipo: rol, rol: rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      nombre: usuarioAdmin.nombre,
      email: usuarioAdmin.email,
      rol: rol,
      tipo: rol
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;