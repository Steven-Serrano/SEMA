require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Importar rutas
const authRoutes = require('./routes/auth');
const authPsicologoRoutes = require('./routes/auth-psicologo');
const usuarioRoutes = require('./routes/usuarios');
const psicologoRoutes = require('./routes/psicologos');
const estadoEmocionalRoutes = require('./routes/estados-emocionales');
const chatsRoutes = require('./routes/chats');
const mensajesRoutes = require('./routes/mensajes');
const notificacionesRoutes = require('./routes/notificaciones');
const citasRoutes = require('./routes/citas');
const adminRoutes = require('./routes/admin');


const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// SERVIR ARCHIVOS ESTÁTICOS (FOTOS DE PERFIL)
// ==========================================
// Esto permite que las fotos subidas a la carpeta /uploads
// sean accesibles desde: http://localhost:3000/uploads/nombre-archivo.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// CONEXIÓN A MONGODB ATLAS
// ==========================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ SEMA conectado a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error de conexión de SEMA:', err));

// ==========================================
// MONTAJE DE RUTAS
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/auth-psicologo', authPsicologoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/psicologos', psicologoRoutes);
app.use('/api/estados-emocionales', estadoEmocionalRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/mensajes', mensajesRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/admin', adminRoutes);

// ==========================================
// RUTA DE PRUEBA
// ==========================================
app.get('/', (req, res) => {
  res.json({ 
    mensaje: 'Servidor SEMA funcionando correctamente ✅',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      usuarios: '/api/usuarios',
      psicologos: '/api/psicologos',
      citas: '/api/citas',
      chats: '/api/chats',
      mensajes: '/api/mensajes',
      notificaciones: '/api/notificaciones',
      estados: '/api/estados-emocionales'
    }
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor SEMA corriendo en http://localhost:${PORT}`);
  console.log(`📁 Carpeta uploads disponible en http://localhost:${PORT}/uploads`);
});