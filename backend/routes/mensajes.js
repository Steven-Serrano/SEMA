const express = require('express');
const Mensaje = require('../models/Mensaje');
const Chat = require('../models/Chat');
const Notificacion = require('../models/Notificacion'); // 🔑 IMPORTANTE
const verificarToken = require('../middleware/auth');

const router = express.Router();

// POST /api/mensajes/:chatId - Enviar un mensaje
router.post('/:chatId', verificarToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { contenido } = req.body;
    const emisorId = req.usuario.id;
    const rolEmisor = req.usuario.rol || req.usuario.tipo || 'usuario'; 

    if (!contenido || contenido.trim() === '') {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    const chat = await Chat.findById(chatId)
      .populate('usuarioId', 'nombre')
      .populate('psicologoId', 'nombre');
      
    if (!chat) return res.status(404).json({ error: 'Chat no encontrado' });

    if (rolEmisor === 'psicologo') {
      if (chat.psicologoId._id.toString() !== emisorId) return res.status(403).json({ error: 'No autorizado' });
    } else {
      if (chat.usuarioId._id.toString() !== emisorId) return res.status(403).json({ error: 'No autorizado' });
    }

    const emisorModel = rolEmisor === 'psicologo' ? 'Psicologo' : 'Usuario';

    const nuevoMensaje = await Mensaje.create({
      chatId, emisorId, emisorModel, contenido: contenido.trim()
    });

    const io = req.app.get('io');
    const receptorId = emisorModel === 'Psicologo' ? chat.usuarioId._id.toString() : chat.psicologoId._id.toString();
    const nombreEmisor = emisorModel === 'Psicologo' ? chat.psicologoId.nombre : chat.usuarioId.nombre;

    // 🔑 GUARDAMOS LA NOTIFICACIÓN EN LA BASE DE DATOS
    if (emisorModel === 'Psicologo') {
      await Notificacion.create({
        usuarioId: chat.usuarioId._id,
        titulo: 'Nuevo mensaje de tu psicólogo',
        mensaje: 'Tu psicólogo te ha respondido en el chat.',
        leida: false
      });
    } else {
      await Notificacion.create({
        psicologoId: chat.psicologoId._id,
        titulo: 'Nuevo mensaje de un estudiante',
        mensaje: 'Un estudiante te ha enviado un mensaje.',
        leida: false
      });
    }

    // Emitimos el mensaje por Socket.io
    if (io) {
      io.to(receptorId).emit('nuevo_mensaje', {
        mensaje: nuevoMensaje,
        nombreEmisor: nombreEmisor,
        chatId: chatId
      });
    }

    await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });
    res.status(201).json({ mensaje: 'Enviado', data: nuevoMensaje });

  } catch (err) {
    console.error('Error al enviar mensaje:', err);
    res.status(500).json({ error: 'Error al enviar el mensaje' });
  }
});

// GET /api/mensajes/:chatId - Obtener historial
router.get('/:chatId', verificarToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const usuarioId = req.usuario.id;
    const rolUsuario = req.usuario.rol || req.usuario.tipo || 'usuario';
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: 'Chat no encontrado' });

    const tieneAcceso =
      (rolUsuario === 'usuario' && chat.usuarioId.toString() === usuarioId) ||
      (rolUsuario === 'psicologo' && chat.psicologoId.toString() === usuarioId);

    if (!tieneAcceso) return res.status(403).json({ error: 'No autorizado' });

    const mensajes = await Mensaje.find({ chatId }).sort({ fecha: 1 });
    res.json(mensajes);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los mensajes' });
  }
});

module.exports = router;