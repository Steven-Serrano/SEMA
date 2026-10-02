const express = require('express');
const Cita = require('../models/Cita');
const Psicologo = require('../models/Psicologo');
const verificarToken = require('../middleware/auth');
const verificarAdmin = require('../middleware/admin');

const router = express.Router();

// POST /api/citas - Un usuario solicita una cita
router.post('/', verificarToken, async (req, res) => {
  try {
    const { psicologoId, fecha, hora, motivo } = req.body;
    const usuarioId = req.usuario.id; 

    // 1. Validar que el psicólogo exista y esté activo
    const psicologo = await Psicologo.findById(psicologoId);
    if (!psicologo || psicologo.estado !== 'activo') {
      return res.status(404).json({ error: 'Psicólogo no disponible' });
    }

    // 2. ✅ CORREGIDO: Validar duplicados usando un rango de fechas (inicio y fin del día)
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);
    
    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    const citaExistente = await Cita.findOne({
      psicologoId,
      fecha: { $gte: inicioDia, $lte: finDia }, // Busca cualquier cita en ese mismo día
      hora,                                     // Y que tenga exactamente la misma hora
      estado: { $in: ['pendiente', 'confirmada'] }
    });

    if (citaExistente) {
      return res.status(400).json({ error: 'El psicólogo ya tiene una cita programada en ese horario' });
    }

    // 3. Crear la cita
    const nuevaCita = await Cita.create({
      usuarioId,
      psicologoId,
      fecha,
      hora,
      motivo,
      estado: 'pendiente'
    });

    res.status(201).json({
      mensaje: 'Cita solicitada correctamente',
      data: nuevaCita
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/citas - Obtener citas (Filtra según el rol del usuario)
router.get('/', verificarToken, async (req, res) => {
  try {
    let query = {};

    // Si es usuario normal, solo ve sus propias citas
    if (req.usuario.rol === 'usuario') {
      query.usuarioId = req.usuario.id;
    } 
    
    const citas = await Cita.find(query)
      .populate('usuarioId', 'nombre email') // Trae nombre y email del usuario
      .populate('psicologoId', 'nombre especialidad') // Trae nombre y especialidad del psicólogo
      .sort({ fecha: 1, hora: 1 }); // Ordenar por fecha y hora ascendente

    res.json(citas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener las citas' });
  }
});

// PUT /api/citas/:id/estado - Actualizar el estado de una cita
// ✅ ASÍ DEBE QUEDAR (permite admin o psicólogo dueño de la cita)
router.put('/:id/estado', verificarToken, async (req, res) => {
  try {
    const { estado } = req.body;
    const usuarioId = req.usuario.id;
    const tipoUsuario = req.usuario.tipo || 'usuario';

    // Validar estado permitido
    const estadosValidos = ['pendiente', 'confirmada', 'cancelada', 'completada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    // Buscar la cita
    const cita = await Cita.findById(req.params.id);
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // ✅ VERIFICAR PERMISOS:
    // - Si es super_administrador: puede modificar cualquier cita
    // - Si es psicólogo: solo puede modificar SUS propias citas
    // - Si es usuario normal: NO puede cambiar estados (solo el psicólogo o admin)
    if (tipoUsuario === 'usuario') {
      return res.status(403).json({ error: 'Acceso denegado — solo el psicólogo o administrador pueden cambiar el estado' });
    }

    if (tipoUsuario === 'psicologo' && cita.psicologoId.toString() !== usuarioId) {
      return res.status(403).json({ error: 'Acceso denegado — esta cita no te pertenece' });
    }

    // Actualizar el estado
    cita.estado = estado;
    await cita.save();

    res.json({
      mensaje: `Estado de la cita actualizado a "${estado}"`,
      data: cita
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
module.exports = router;