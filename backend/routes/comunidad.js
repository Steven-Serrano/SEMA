const express = require('express');

const Publicacion = require('../models/Publicacion');
const verificarToken = require('../middleware/auth');

const router = express.Router();


// ==========================================
// GET /api/comunidad
// Obtener todas las publicaciones
// ==========================================

router.get('/', verificarToken, async (req, res) => {

  try {

    const publicaciones = await Publicacion.find()
      .populate('usuario', 'nombre fotoPerfil')
      .populate('comentarios.usuario', 'nombre fotoPerfil')
      .sort({ createdAt: -1 });

    res.json(publicaciones);

  } catch (error) {

    console.error('Error al obtener publicaciones:', error);

    res.status(500).json({
      error: 'Error al obtener las publicaciones'
    });

  }

});


// ==========================================
// POST /api/comunidad
// Crear una publicación
// ==========================================

router.post('/', verificarToken, async (req, res) => {

  try {

    const { texto, categoria } = req.body;

    if (!texto || !categoria) {

      return res.status(400).json({
        error: 'El texto y la categoría son obligatorios'
      });

    }

    const nuevaPublicacion = await Publicacion.create({

      usuario: req.usuario.id,

      texto: texto.trim(),

      categoria

    });

    const publicacion = await Publicacion.findById(
      nuevaPublicacion._id
    )
      .populate('usuario', 'nombre fotoPerfil')
      .populate('comentarios.usuario', 'nombre fotoPerfil');

    res.status(201).json(publicacion);

  } catch (error) {

    console.error('Error al crear publicación:', error);

    res.status(500).json({
      error: 'Error al crear la publicación'
    });

  }

});

// GET /api/comunidad/publicas - Obtener las últimas 3 publicaciones para el Landing (Sin Token)
router.get('/publicas', async (req, res) => {
  try {
    const posts = await Publicacion.find()
      .populate('autor', 'nombre fotoPerfil') // Traemos los datos del autor
      .sort({ createdAt: -1 }) // Las más recientes primero
      .limit(3); // Solo las 3 últimas

    res.json(posts);
  } catch (err) {
    console.error("Error cargando posts públicos:", err);
    res.status(500).json({ error: 'Error al obtener las publicaciones públicas' });
  }
});


module.exports = router;