const mongoose = require('mongoose');

const HabitoSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  tipo: {
    type: String,
    enum: ['meditacion', 'diario', 'sueno'],
    required: true
  },
  contenido: {
    type: String,
    default: '' // Solo se usa para el diario
  },
  horas: {
    type: Number,
    default: 0 // Solo se usa para el sueño
  },
  calidad: {
    type: String,
    default: '' // Solo se usa para el sueño
  },
    motivo: {
    type: String,
    default: '' // Aquí se guardará el "¿Por qué?"
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Habito', HabitoSchema);