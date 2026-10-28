const express = require('express');
const Habito = require('../models/Habito');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// 1. POST /api/habitos/meditaciones
router.post('/meditaciones', verificarToken, async (req, res) => {
  try {
    await Habito.create({
      usuarioId: req.usuario.id,
      tipo: 'meditacion',
      fecha: new Date()
    });
    res.status(201).json({ mensaje: 'Meditación registrada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/habitos/diario
router.post('/diario', verificarToken, async (req, res) => {
  try {
    await Habito.create({
      usuarioId: req.usuario.id,
      tipo: 'diario',
      contenido: req.body.contenido,
      fecha: new Date()
    });
    res.status(201).json({ mensaje: 'Entrada de diario guardada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/habitos/sueno
router.post('/sueno', verificarToken, async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); 
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1); 

    const registroExistente = await Habito.findOne({
      usuarioId: req.usuario.id,
      tipo: 'sueno',
      fecha: { $gte: hoy, $lt: manana }
    });

    if (registroExistente) {
      return res.status(400).json({ error: 'Ya registraste tus horas de sueño hoy. Vuelve mañana.' });
    }

    await Habito.create({
      usuarioId: req.usuario.id,
      tipo: 'sueno',
      horas: req.body.horas,
      calidad: req.body.calidad,
      motivo: req.body.motivo || '', // 🔑 GUARDAMOS EL MOTIVO
      fecha: new Date()
    });
    
    res.status(201).json({ mensaje: 'Registro de sueño guardado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/habitos/estadisticas-semanales
// Esta ruta calcula los días únicos de la última semana para llenar las barras del dashboard
router.get('/estadisticas-semanales', verificarToken, async (req, res) => {
  try {
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    const registros = await Habito.find({
      usuarioId: req.usuario.id,
      fecha: { $gte: hace7Dias }
    });

    // Usamos un Set para contar días únicos (si meditas 2 veces hoy, cuenta como 1 día)
    const contarDiasUnicos = (tipo) => {
      return new Set(
        registros
          .filter(r => r.tipo === tipo)
          .map(r => r.fecha.toISOString().split('T')[0])
      ).size;
    };

    res.json({
      meditacion: contarDiasUnicos('meditacion'),
      diario: contarDiasUnicos('diario'),
      sueno: contarDiasUnicos('sueno')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/habitos/sueno - Obtener historial de sueño
router.get('/sueno', verificarToken, async (req, res) => {
  try {
    const registros = await Habito.find({ 
      usuarioId: req.usuario.id, 
      tipo: 'sueno' 
    }).sort({ fecha: -1 }); // Los más recientes primero
    
    res.json(registros);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/habitos/diario - Obtener todas las entradas del diario
router.get('/diario', verificarToken, async (req, res) => {
  try {
    const entradas = await Habito.find({ 
      usuarioId: req.usuario.id, 
      tipo: 'diario' 
    }).sort({ fecha: -1 }); // Las más recientes primero
    
    res.json(entradas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/habitos/diario/:id - Eliminar una entrada
router.delete('/diario/:id', verificarToken, async (req, res) => {
  try {
    const eliminada = await Habito.findOneAndDelete({
      _id: req.params.id,
      usuarioId: req.usuario.id,
      tipo: 'diario'
    });
    
    if (!eliminada) return res.status(404).json({ error: 'Entrada no encontrada' });
    res.json({ mensaje: 'Entrada eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/habitos/diario/:id - Editar una entrada
router.put('/diario/:id', verificarToken, async (req, res) => {
  try {
    const { contenido } = req.body;
    if (!contenido) return res.status(400).json({ error: 'El contenido no puede estar vacío' });

    const actualizada = await Habito.findOneAndUpdate(
      { _id: req.params.id, usuarioId: req.usuario.id, tipo: 'diario' },
      { contenido: contenido },
      { new: true } // Devuelve el documento actualizado
    );

    if (!actualizada) return res.status(404).json({ error: 'Entrada no encontrada' });
    
    res.json(actualizada);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/habitos/resumen-mensual
router.get('/resumen-mensual', verificarToken, async (req, res) => {
  try {
    const ahora = new Date();
    // Calculamos el primer y último día del mes actual
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

    const registros = await Habito.find({
      usuarioId: req.usuario.id,
      fecha: { $gte: inicioMes, $lte: finMes }
    });

    // Contamos cuántos hay de cada tipo
    const conteo = {
      meditacion: registros.filter(r => r.tipo === 'meditacion').length,
      diario: registros.filter(r => r.tipo === 'diario').length,
      sueno: registros.filter(r => r.tipo === 'sueno').length
    };

    res.json(conteo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;