const express = require('express');
const Chat = require('../models/Chat');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// POST /api/chats - Iniciar o recuperar un chat
router.post('/', verificarToken, async (req, res) => {
  try {
    const { psicologoId } = req.body;
    const usuarioId = req.usuario.id;

    let chat = await Chat.findOne({ usuarioId, psicologoId })
      .populate('psicologoId', 'nombre especialidad');

    if (chat) {
      return res.status(200).json({
        mensaje: 'Chat recuperado exitosamente',
        data: chat
      });
    }

    chat = await Chat.create({
      usuarioId,
      psicologoId,
      estado: 'activo'
    });

    const chatCompleto = await Chat.findById(chat._id)
      .populate('psicologoId', 'nombre especialidad');

    res.status(201).json({
      mensaje: 'Chat creado exitosamente',
      data: chatCompleto
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/chats - Obtener chats (detecta si es usuario o psicólogo)
router.get('/', verificarToken, async (req, res) => {
  try {
    let chats;
    
    if (req.usuario.tipo === 'psicologo') {
      // Si es psicólogo, buscar chats donde él sea el destinatario
      // ✅ POBLAR usuarioId con nombre y email
      chats = await Chat.find({ psicologoId: req.usuario.id })
        .populate('usuarioId', 'nombre email')
        .populate('psicologoId', 'nombre especialidad')
        .sort({ updatedAt: -1 });
    } else {
      // Si es usuario normal, buscar chats donde él sea el dueño
      chats = await Chat.find({ usuarioId: req.usuario.id })
        .populate('psicologoId', 'nombre especialidad')
        .populate('usuarioId', 'nombre email')
        .sort({ updatedAt: -1 });
    }

    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los chats' });
  }
});

module.exports = router;