const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  psicologoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Psicologo', required: true },
  fecha: { type: Date, required: true },
  hora: { type: String, required: true },
  motivo: { type: String, required: true, trim: true },
  estado: { 
    type: String, 
    enum: ['pendiente', 'confirmada', 'cancelada', 'completada'], 
    default: 'pendiente' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Cita', citaSchema);