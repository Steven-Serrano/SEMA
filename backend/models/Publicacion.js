const mongoose = require('mongoose');

const ComentarioSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  texto: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PublicacionSchema = new mongoose.Schema({

  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  texto: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },

  categoria: {
    type: String,
    enum: [
      'Motivación',
      'Reflexión',
      'Estrés Académico',
      'Logro Personal'
    ],
    required: true
  },

  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }],

  comentarios: [ComentarioSchema],

  compartidos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }]

}, {
  timestamps: true
});

module.exports = mongoose.model('Publicacion', PublicacionSchema);