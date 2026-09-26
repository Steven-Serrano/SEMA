// backend/server.js

// 1. Importar dependencias de SEMA
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');
const authRoutes     = require('./routes/auth');         // ← NUEVO S14
const verificarToken = require('./middleware/auth');     // ← NUEVO S14
const verificarAdmin = require('./middleware/admin');    // ← NUEVO S14

// 2. Crear la aplicación de SEMA y definir el puerto
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Activar middlewares globales de SEMA
app.use(cors());
app.use(express.json());

// 4. Conectar SEMA con MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ SEMA conectado a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error de conexión de SEMA:', err));

// 5. GET /api/usuario — público (lee desde Atlas)
app.get('/api/usuario', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({
      error: 'Error al obtener usuario'
    });
  }
});

// 6. POST /api/usuario — crear usuario de SEMA
app.post('/api/usuario', async (req, res) => {
  try {
    const nuevoUsuario = await Usuario.create(req.body);
    res.status(201).json(nuevoUsuario);
  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(400).json({
      error: err.message
    });
  }
});

// 7. PUT /api/usuario/:id — actualizar usuario de SEMA
app.put('/api/usuario/:id', async (req, res) => {
  try {
    const actualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!actualizado) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json(actualizado);

  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    res.status(400).json({
      error: err.message
    });
  }
});

// 8. DELETE /api/usuario/:id — eliminar usuario de SEMA
app.delete('/api/usuario/:id', async (req, res) => {
  try {
    const eliminado = await Usuario.findByIdAndDelete(req.params.id);

    if (!eliminado) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      mensaje: 'Usuario eliminado correctamente',
      eliminado
    });

  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(400).json({
      error: err.message
    });
  }
});

// 9. Ruta de prueba de SEMA
app.get('/', (req, res) => {
  res.json({
    mensaje: 'Servidor SEMA funcionando correctamente ✅'
  });
});

// 10. Arrancar el servidor de SEMA
app.listen(PORT, () => {
  console.log(`Servidor SEMA en http://localhost:${PORT}`);
});