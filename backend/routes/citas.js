const express = require('express');
const Cita = require('../models/Cita');
const Psicologo = require('../models/Psicologo');
const Notificacion = require('../models/Notificacion'); // 🔑 NUEVO
const verificarToken = require('../middleware/auth');

const router = express.Router();

// POST /api/citas - Un usuario solicita una cita
router.post('/', verificarToken, async (req, res) => {
  try {
    const { psicologoId, fecha, hora, motivo } = req.body;
    const usuarioId = req.usuario.id; 

    const psicologo = await Psicologo.findById(psicologoId);
    if (!psicologo || psicologo.estado !== 'activo') {
      return res.status(404).json({ error: 'Psicólogo no disponible' });
    }

    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    const citaExistente = await Cita.findOne({
      psicologoId,
      fecha: { $gte: inicioDia, $lte: finDia },
      hora,
      estado: { $in: ['pendiente', 'confirmada'] }
    });

    if (citaExistente) {
      return res.status(400).json({ error: 'El psicólogo ya tiene una cita en ese horario' });
    }

    const nuevaCita = await Cita.create({
      usuarioId, psicologoId, fecha, hora, motivo, estado: 'pendiente'
    });

    // 🔑 NOTIFICACIÓN AL PSICÓLOGO
    const nuevaNotif = await Notificacion.create({
      psicologoId: psicologoId,
      titulo: 'Nueva cita agendada',
      mensaje: 'Un estudiante ha agendado una cita contigo.',
      leida: false
    });

    // Emitir por Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(psicologoId.toString()).emit('nueva_notificacion', nuevaNotif);
    }

    res.status(201).json({ mensaje: 'Cita solicitada', data: nuevaCita });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/citas - Obtener citas (Filtrado por rol)
router.get('/', verificarToken, async (req, res) => {
  try {
    const rol = req.usuario.rol || req.usuario.tipo;
    let query = {};

    if (rol === 'psicologo') {
      query.psicologoId = req.usuario.id;
    } else {
      query.usuarioId = req.usuario.id;
      query.ocultaEstudiante = false; 
    }
    
    const citas = await Cita.find(query)
      .populate('usuarioId', 'nombre email fotoPerfil')
      .populate('psicologoId', 'nombre especialidad fotoPerfil')
      .sort({ fecha: 1, hora: 1 });

    res.json(citas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener las citas' });
  }
});

// PUT /api/citas/:id/cancelar - Cancelar cita
router.put('/:id/cancelar', verificarToken, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });

    if (cita.usuarioId.toString() !== req.usuario.id) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    cita.estado = 'cancelada';
    await cita.save();
    res.json({ mensaje: 'Cita cancelada', data: cita });
  } catch (err) {
    res.status(500).json({ error: 'Error al cancelar' });
  }
});

// PUT /api/citas/:id/ocultar - Ocultar cita
router.put('/:id/ocultar', verificarToken, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });

    if (cita.usuarioId.toString() !== req.usuario.id) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    cita.ocultaEstudiante = true;
    await cita.save();
    res.json({ mensaje: 'Cita ocultada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al ocultar' });
  }
});

// PUT /api/citas/:id/estado - Actualizar estado (Psicólogo)
router.put('/:id/estado', verificarToken, async (req, res) => {
  try {
    const { estado } = req.body;
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol || req.usuario.tipo || 'usuario';

    const estadosValidos = ['pendiente', 'confirmada', 'cancelada', 'completada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });

    if (rol === 'usuario') {
      return res.status(403).json({ error: 'Solo el psicólogo puede cambiar el estado' });
    }

    if (rol === 'psicologo' && cita.psicologoId.toString() !== usuarioId) {
      return res.status(403).json({ error: 'Esta cita no te pertenece' });
    }

    cita.estado = estado;
    await cita.save();

    res.json({ mensaje: `Estado actualizado a ${estado}`, data: cita });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/citas/:id - Eliminar cita
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });

    const userId = req.usuario.id;
    const esEstudiante = cita.usuarioId && cita.usuarioId.toString() === userId;
    const esPsicologo = cita.psicologoId && cita.psicologoId.toString() === userId;

    if (!esEstudiante && !esPsicologo) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta cita' });
    }

    await Cita.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Cita eliminada del historial' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar la cita' });
  }
});

module.exports = router;