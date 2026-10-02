const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  titulo: { type: String, required: true, trim: true },
  mensaje: { type: String, required: true, trim: true },
  fecha: { type: Date, default: Date.now },
  leida: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notificacion', notificacionSchema);