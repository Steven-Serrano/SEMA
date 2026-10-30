require('dotenv').config();
const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io'); 
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const Mensaje = require('./models/Mensaje'); 

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
const comunidadRoutes = require('./routes/comunidad');
const habitosRoutes = require('./routes/habitos');
const estadisticasRoutes = require('./routes/estadisticas');
const authAdminRoutes = require('./routes/auth-admin');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ==========================================
// CONFIGURACIÓN DE SOCKET.IO
// ==========================================
const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

// Lógica de conexión de Sockets
io.on('connection', (socket) => {

  socket.on('registrar_usuario', (userId) => {
    if (userId) {
      socket.join(userId.toString());
    }
  });

  socket.on('escribiendo', ({ chatId, receptorId }) => {
    if (receptorId) {
      socket.to(receptorId.toString()).emit('usuario_escribiendo', chatId);
    }
  });

  socket.on('dejo_de_escribir', ({ chatId, receptorId }) => {
    if (receptorId) {
      socket.to(receptorId.toString()).emit('usuario_dejo_de_escribir', chatId);
    }
  });

  socket.on('mensajes_vistos', async ({ chatId, emisorId }) => {
    try {
      await Mensaje.updateMany(
        { chatId, emisorId, leido: false },
        { leido: true }
      );
      if (emisorId) {
        socket.to(emisorId.toString()).emit('mensajes_marcados_leidos', chatId);
      }
    } catch (error) {
      console.error("Error al marcar como leído:", error);
    }
  });

});

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
app.use('/api/comunidad', comunidadRoutes);
app.use('/api/habitos', habitosRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/auth-admin', authAdminRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: 'Servidor SEMA funcionando ✅', version: '1.0.0' });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor SEMA corriendo en http://localhost:${PORT}`);
  console.log(`🔌 Socket.io escuchando conexiones en tiempo real`);
});