const express = require('express');
const Chat = require('../models/Chat');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// GET /api/chats - Obtener chats del usuario logueado
router.get('/', verificarToken, async (req, res) => {
  try {
    // 🔑 Validación robusta: acepta 'rol' o 'tipo'
    const rol = req.usuario.rol || req.usuario.tipo;
    let query = {};

    if (rol === 'psicologo') {
      query = { psicologoId: req.usuario.id };
    } else {
      query = { usuarioId: req.usuario.id };
    }

    const chats = await Chat.find(query)
      .populate('usuarioId', 'nombre email fotoPerfil') // Trae datos del estudiante
      .populate('psicologoId', 'nombre email fotoPerfil especialidad') // Trae datos del psicólogo
      .sort({ updatedAt: -1 }); // Los más recientes primero

    res.json(chats);
  } catch (err) {
    console.error("Error al obtener chats:", err);
    res.status(500).json({ error: 'Error al obtener los chats' });
  }
});

// POST /api/chats - Crear o recuperar un chat (Para SOS y Nuevo Chat)
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

    // Buscar si ya existe un chat entre estos dos
    let chatExistente = await Chat.findOne({ 
      usuarioId: finalUsuarioId, 
      psicologoId: finalPsicologoId 
    })
    .populate('usuarioId', 'nombre email fotoPerfil')
    .populate('psicologoId', 'nombre email fotoPerfil especialidad');

    if (chatExistente) return res.json(chatExistente);

    // Si no existe, crear uno nuevo
    const nuevoChat = await Chat.create({
      usuarioId: finalUsuarioId,
      psicologoId: finalPsicologoId
    });

    const chatPoblado = await Chat.findById(nuevoChat._id)
      .populate('usuarioId', 'nombre email fotoPerfil')
      .populate('psicologoId', 'nombre email fotoPerfil especialidad');

    res.status(201).json(chatPoblado);
  } catch (err) {
    console.error("Error creando chat:", err);
    res.status(500).json({ error: 'Error al crear el chat' });
  }
});

module.exports = router;