const mongoose = require('mongoose');

const MensajeSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  emisorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  // 🔑 ESTO ES CLAVE: Saber si el mensaje lo envió un Usuario o un Psicologo
  emisorModel: {
    type: String,
    enum: ['Usuario', 'Psicologo'],
    required: true
  },
  contenido: {
    type: String,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Mensaje', MensajeSchema);