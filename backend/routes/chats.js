const express = require('express');
const Chat = require('../models/Chat');
const Mensaje = require('../models/Mensaje');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// GET /api/chats
router.get('/', verificarToken, async (req, res) => {
  try {
    const rol = req.usuario.rol || req.usuario.tipo;
    let query = {};

    if (rol === 'psicologo') {
      query = { psicologoId: req.usuario.id };
    } else {
      query = { usuarioId: req.usuario.id };
    }

    const chats = await Chat.find(query)
      .populate('usuarioId', 'nombre email fotoPerfil')
      // 🔑 Agregamos 'disponibilidad' aquí
      .populate('psicologoId', 'nombre email fotoPerfil especialidad disponibilidad')
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    console.error("Error al obtener chats:", err);
    res.status(500).json({ error: 'Error al obtener los chats' });
  }
});

// POST /api/chats
router.post('/', verificarToken, async (req, res) => {
  try {
    const { usuarioId, psicologoId } = req.body;
    const rol = req.usuario.rol || req.usuario.tipo;
    let finalUsuarioId, finalPsicologoId;

    if (rol === 'psicologo') {
      finalPsicologoId = req.usuario.id;
      finalUsuarioId = usuarioId;
    } else {
      finalUsuarioId = req.usuario.id;
      finalPsicologoId = psicologoId;
    }

    if (!finalUsuarioId || !finalPsicologoId) {
      return res.status(400).json({ error: 'Faltan datos para crear el chat' });
    }

    let chatExistente = await Chat.findOne({ 
      usuarioId: finalUsuarioId, 
      psicologoId: finalPsicologoId 
    })
    .populate('usuarioId', 'nombre email fotoPerfil')
    // 🔑 Agregamos 'disponibilidad' aquí también
    .populate('psicologoId', 'nombre email fotoPerfil especialidad disponibilidad');

    if (chatExistente) return res.json(chatExistente);

    const nuevoChat = await Chat.create({
      usuarioId: finalUsuarioId,
      psicologoId: finalPsicologoId
    });

    const chatPoblado = await Chat.findById(nuevoChat._id)
      .populate('usuarioId', 'nombre email fotoPerfil')
      // 🔑 Y aquí
      .populate('psicologoId', 'nombre email fotoPerfil especialidad disponibilidad');

    res.status(201).json(chatPoblado);
  } catch (err) {
    console.error("Error creando chat:", err);
    res.status(500).json({ error: 'Error al crear el chat' });
  }
});

// DELETE /api/chats/:chatId
router.delete('/:chatId', verificarToken, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat no encontrado' });

    const userId = req.usuario.id;
    const isPsicologo = chat.psicologoId && chat.psicologoId.toString() === userId;
    const isUsuario = chat.usuarioId && chat.usuarioId.toString() === userId;

    if (!isPsicologo && !isUsuario) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este chat' });
    }

    await Mensaje.deleteMany({ chatId: req.params.chatId });
    await Chat.findByIdAndDelete(req.params.chatId);

    res.json({ mensaje: 'Chat eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar chat:', err);
    res.status(500).json({ error: 'Error al eliminar el chat' });
  }
});

module.exports = router;