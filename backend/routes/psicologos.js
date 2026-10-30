const express = require('express');
const Psicologo = require('../models/Psicologo');
const verificarToken = require('../middleware/auth');
const upload = require('../middleware/upload'); 

const router = express.Router();

// GET /api/psicologos - Obtener TODOS los psicólogos (Para el panel de admin)
router.get('/', async (req, res) => {
  try {
    const psicologos = await Psicologo.find().select('-password');
    res.json(psicologos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener psicólogos' });
  }
});

// GET /api/psicologos/directorio - Obtener solo los activos (Para el estudiante)
router.get('/directorio', async (req, res) => {
  try {
    const psicologos = await Psicologo.find({ estado: 'activo' }).select('-password');
    res.json(psicologos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener psicólogos' });
  }
});

// GET /api/psicologos/perfil
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    const psicologo = await Psicologo.findById(req.usuario.id).select('-password');
    if (!psicologo) return res.status(404).json({ error: 'Psicólogo no encontrado' });
    res.json(psicologo);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
});

// PUT /api/psicologos/perfil
router.put('/perfil', verificarToken, async (req, res) => {
  try {
    const { nombre, email, telefono, ciudad, biografia, documento, especialidad } = req.body;
    const psicologo = await Psicologo.findById(req.usuario.id);
    if (!psicologo) return res.status(404).json({ error: 'Psicólogo no encontrado' });

    if (nombre) psicologo.nombre = nombre;
    if (email) psicologo.email = email;
    if (telefono) psicologo.telefono = telefono;
    if (ciudad) psicologo.ciudad = ciudad;
    if (biografia) psicologo.biografia = biografia;
    if (documento) psicologo.documento = documento;
    if (especialidad) psicologo.especialidad = especialidad;

    await psicologo.save();
    res.json({ mensaje: 'Perfil actualizado', data: psicologo });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/psicologos/subir-foto
router.put('/subir-foto', verificarToken, upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se ha seleccionado ninguna imagen' });
    const psicologo = await Psicologo.findById(req.usuario.id);
    if (!psicologo) return res.status(404).json({ error: 'Psicólogo no encontrado' });
    psicologo.fotoPerfil = `/uploads/${req.file.filename}`;
    await psicologo.save();
    res.json({ mensaje: 'Foto actualizada', fotoPerfil: psicologo.fotoPerfil });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/psicologos/cambiar-password
router.put('/cambiar-password', verificarToken, async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    if (!passwordActual || !passwordNueva) return res.status(400).json({ error: 'Ambas contraseñas son requeridas' });
    if (passwordNueva.length < 6) return res.status(400).json({ error: 'Mínimo 6 caracteres' });

    const psicologo = await Psicologo.findById(req.usuario.id);
    if (!psicologo) return res.status(404).json({ error: 'Psicólogo no encontrado' });

    const esValida = await psicologo.comparePassword(passwordActual);
    if (!esValida) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    psicologo.password = passwordNueva;
    await psicologo.save();
    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/psicologos/disponibilidad
router.post('/disponibilidad', verificarToken, async (req, res) => {
  try {
    const { fecha, inicio, fin } = req.body;
    if (!fecha || !inicio || !fin) return res.status(400).json({ error: 'Faltan datos' });
    if (inicio >= fin) return res.status(400).json({ error: 'La hora de inicio debe ser menor a la de fin' });
    const psicologo = await Psicologo.findByIdAndUpdate(req.usuario.id, { $push: { disponibilidad: { fecha, inicio, fin } } }, { new: true });
    res.json({ mensaje: 'Turno agregado', disponibilidad: psicologo.disponibilidad });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/psicologos/disponibilidad/:id
router.delete('/disponibilidad/:id', verificarToken, async (req, res) => {
  try {
    await Psicologo.findByIdAndUpdate(req.usuario.id, { $pull: { disponibilidad: { _id: req.params.id } } });
    res.json({ mensaje: 'Turno eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;