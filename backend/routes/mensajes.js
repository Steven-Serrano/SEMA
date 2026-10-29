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
    
    // 🔑 CORRECCIÓN: Usamos 'rol' en lugar de 'tipo'
    const rolEmisor = req.usuario.rol || req.usuario.tipo || 'usuario'; 

    if (!contenido || contenido.trim() === '') {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    // 1. Verificar que el chat existe
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    // 2. Verificar permisos según el rol
    if (rolEmisor === 'psicologo') {
      if (chat.psicologoId.toString() !== emisorId) {
        return res.status(403).json({ error: 'No tienes permiso para escribir en este chat' });
      }
    } else {
      if (chat.usuarioId.toString() !== emisorId) {
        return res.status(403).json({ error: 'No tienes permiso para escribir en este chat' });
      }
    }

    const emisorModel = rolEmisor === 'psicologo' ? 'Psicologo' : 'Usuario';

    // 3. Crear el mensaje
    const nuevoMensaje = await Mensaje.create({
      chatId,
      emisorId,
      emisorModel,
      contenido: contenido.trim()
    });

    // 4. Notificaciones automáticas
    if (emisorModel === 'Psicologo') {
      // Si el psicólogo escribe, notificamos al estudiante
      await Notificacion.create({
        usuarioId: chat.usuarioId,
        titulo: 'Nuevo mensaje de tu psicólogo',
        mensaje: 'Tu psicólogo te ha respondido en el chat.',
        leida: false
      });
    } else {
      // Si el estudiante escribe, notificamos al psicólogo (requiere que el modelo Notificacion lo soporte, o podemos omitirlo si solo notifica a estudiantes)
      // await Notificacion.create({...});
    }

    // 5. Actualizar la fecha del chat para que suba en la lista
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
    const rolUsuario = req.usuario.rol || req.usuario.tipo || 'usuario';

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    const tieneAcceso =
      (rolUsuario === 'usuario' && chat.usuarioId.toString() === usuarioId) ||
      (rolUsuario === 'psicologo' && chat.psicologoId.toString() === usuarioId);

    if (!tieneAcceso) {
      return res.status(403).json({ error: 'No tienes permiso para ver este chat' });
    }

    const mensajes = await Mensaje.find({ chatId }).sort({ fecha: 1 });

    res.json(mensajes);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los mensajes' });
  }
});

module.exports = router;