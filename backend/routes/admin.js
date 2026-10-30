const express = require('express');
const Psicologo = require('../models/Psicologo');
const AdministradorSENA = require('../models/AdministradorSENA'); 
const Usuario = require('../models/Usuario');
const { verificarAdminSENA, verificarSuperAdmin } = require('../middleware/admin'); 
const verificarToken = require('../middleware/auth');

const router = express.Router();

// ==========================================
// 1. GESTIÓN DE PSICÓLOGOS (Admin SENA y Super Admin)
// ==========================================
router.post('/crear-psicologo', verificarToken, verificarAdminSENA, async (req, res) => {
  try {
    const { nombre, email, password, especialidad, telefono } = req.body;
    if (!nombre || !email || !password || !especialidad) return res.status(400).json({ error: 'Faltan datos' });
    const existe = await Psicologo.findOne({ email });
    if (existe) return res.status(400).json({ error: 'El correo ya está registrado' });

    const nuevoPsicologo = await Psicologo.create({ nombre, email, password, especialidad, telefono, estado: 'activo' });
    res.status(201).json({ mensaje: 'Psicólogo registrado', id: nuevoPsicologo._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/psicologos/:id/estado', verificarToken, verificarAdminSENA, async (req, res) => {
  try {
    const { estado } = req.body;
    const psicologo = await Psicologo.findByIdAndUpdate(req.params.id, { estado }, { new: true }).select('-password');
    if (!psicologo) return res.status(404).json({ error: 'Psicólogo no encontrado' });
    res.json({ mensaje: `Psicólogo ${estado}`, data: psicologo });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🔑 NUEVO: Eliminar Psicólogo
router.delete('/psicologos/:id', verificarToken, verificarAdminSENA, async (req, res) => {
  try {
    const psicologo = await Psicologo.findByIdAndDelete(req.params.id);
    if (!psicologo) return res.status(404).json({ error: 'Psicólogo no encontrado' });
    res.json({ mensaje: 'Psicólogo eliminado permanentemente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 2. GESTIÓN DE ESTUDIANTES
// ==========================================
router.put('/usuarios/:id/estado', verificarToken, verificarAdminSENA, async (req, res) => {
  try {
    const { activo } = req.body;
    const usuario = await Usuario.findByIdAndUpdate(req.params.id, { activo }, { new: true }).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: `Estudiante ${activo ? 'activado' : 'baneado'}`, data: usuario });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/usuarios/:id', verificarToken, verificarAdminSENA, async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Estudiante eliminado permanentemente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 3. GESTIÓN DE ADMINISTRADORES SENA (Solo Super Admin)
// ==========================================
router.post('/crear-admin-sena', verificarToken, verificarSuperAdmin, async (req, res) => {
  try {
    const { nombre, email, password, ficha, centro } = req.body;
    if (!nombre || !email || !password || !ficha || !centro) return res.status(400).json({ error: 'Faltan datos' });
    const existe = await AdministradorSENA.findOne({ email });
    if (existe) return res.status(400).json({ error: 'El correo ya está registrado' });

    const nuevoAdmin = await AdministradorSENA.create({ nombre, email, password, ficha, centro });
    res.status(201).json({ mensaje: 'Administrador SENA creado', id: nuevoAdmin._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/admins-sena', verificarToken, verificarSuperAdmin, async (req, res) => {
  try {
    const admins = await AdministradorSENA.find().select('-password').sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) { res.status(500).json({ error: 'Error al obtener administradores' }); }
});

// 🔑 NUEVO: Eliminar Administrador SENA
router.delete('/admins-sena/:id', verificarToken, verificarSuperAdmin, async (req, res) => {
  try {
    const admin = await AdministradorSENA.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ error: 'Administrador no encontrado' });
    res.json({ mensaje: 'Administrador SENA eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;