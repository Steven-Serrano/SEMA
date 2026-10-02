const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  // refPath permite que emisorId pueda referenciar dinámicamente a Usuario o Psicologo
  emisorId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'emisorModel' },
  emisorModel: { type: String, required: true, enum: ['Usuario', 'Psicologo'] },
  contenido: { type: String, required: true, trim: true },
  fecha: { type: Date, default: Date.now },
  leido: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Mensaje', mensajeSchema);