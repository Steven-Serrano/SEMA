const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  psicologoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Psicologo', required: true },
  fechaCreacion: { type: Date, default: Date.now },
  estado: { type: String, enum: ['activo', 'cerrado'], default: 'activo' }
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);