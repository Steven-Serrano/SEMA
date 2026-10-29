const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const psicologoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  especialidad: { type: String, required: true, trim: true },
  telefono: { type: String, trim: true },
  documento: { type: String, trim: true },
  ciudad: { type: String, trim: true },
  biografia: { type: String, default: '' },
  fotoPerfil: { type: String, default: '' },
  verificado: { type: Boolean, default: false },
  estado: { type: String, enum: ['activo', 'inactivo'], default: 'activo' },
  
  // 🔑 NUEVO CAMPO: Bloques de disponibilidad
  disponibilidad: [
    {
      fecha: { type: String, required: true }, // Formato "YYYY-MM-DD"
      inicio: { type: String, required: true }, // Formato "HH:mm"
      fin: { type: String, required: true }     // Formato "HH:mm"
    }
  ]
}, { timestamps: true });

// Encriptar contraseña automáticamente antes de guardar
psicologoSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Método para comparar contraseñas
psicologoSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Psicologo', psicologoSchema);