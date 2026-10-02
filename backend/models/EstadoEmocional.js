const mongoose = require('mongoose');

const estadoEmocionalSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  estado: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  fecha: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('EstadoEmocional', estadoEmocionalSchema);