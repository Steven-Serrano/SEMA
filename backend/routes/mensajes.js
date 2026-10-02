const express = require('express');
const Mensaje = require('../models/Mensaje');
const Chat = require('../models/Chat');
const Notificacion = require('../models/Notificacion');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// POST /api/mensajes/:chatId - Enviar un mensaje (Usuario o Psicólogo)
router.post('/:chatId', verificarToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { contenido } = req.body;
    const emisorId = req.usuario.id;
    const tipoEmisor = req.usuario.tipo || 'usuario'; // 'usuario' o 'psicologo'

    if (!contenido || contenido.trim() === '') {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    // 1. Verificar que el chat existe
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    // 2. Verificar permisos según el tipo de emisor
    if (tipoEmisor === 'usuario') {
      if (chat.usuarioId.toString() !== emisorId) {
        return res.status(403).json({ error: 'No tienes permiso para escribir en este chat' });
      }
    } else if (tipoEmisor === 'psicologo') {
      if (chat.psicologoId.toString() !== emisorId) {
        return res.status(403).json({ error: 'No tienes permiso para escribir en este chat' });
      }
    } else {
      return res.status(403).json({ error: 'Tipo de usuario no válido' });
    }

    const emisorModel = tipoEmisor === 'psicologo' ? 'Psicologo' : 'Usuario';

    const nuevoMensaje = await Mensaje.create({
      chatId,
      emisorId,
      emisorModel,
      contenido: contenido.trim()
    });

    // Si el que escribe es el psicólogo, notificamos al usuario
    if (emisorModel === 'Psicologo') {
      const chatInfo = await Chat.findById(chatId).select('usuarioId');

      await Notificacion.create({
        usuarioId: chatInfo.usuarioId,
        titulo: 'Nuevo mensaje de tu psicólogo',
        mensaje: 'Tu psicólogo te ha respondido en el chat.',
        leida: false
      });
    }

    await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });

    res.status(201).json({
      mensaje: 'Mensaje enviado correctamente',
      data: nuevoMensaje
    });
  } catch (err) {
    console.error('Error al enviar mensaje:', err);
    res.status(500).json({ error: 'Error al enviar el mensaje' });
  }
});

// GET /api/mensajes/:chatId - Obtener historial de mensajes
router.get('/:chatId', verificarToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const usuarioId = req.usuario.id;
    const tipoUsuario = req.usuario.tipo || 'usuario';

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    const tieneAcceso =
      (tipoUsuario === 'usuario' && chat.usuarioId.toString() === usuarioId) ||
      (tipoUsuario === 'psicologo' && chat.psicologoId.toString() === usuarioId);

    if (!tieneAcceso) {
      return res.status(403).json({ error: 'No tienes permiso para ver este chat' });
    }

    const mensajes = await Mensaje.find({ chatId }).sort({ fecha: 1 });

    res.json(mensajes);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los mensajes' });
  }
});

// GET /api/mensajes/mis-chats - Obtener todos los chats del psicólogo autenticado
router.get('/mis-chats', verificarToken, async (req, res) => {
  try {
    const psicologoId = req.usuario.id;

    if (req.usuario.tipo !== 'psicologo') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const chats = await Chat.find({ psicologoId })
      .populate('usuarioId', 'nombre email')
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los chats' });
  }
});

module.exports = router;