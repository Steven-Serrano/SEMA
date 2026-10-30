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
  },
  // 🔑 NUEVO CAMPO: Para los chulitos
  leido: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Mensaje', MensajeSchema);