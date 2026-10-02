const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const psicologoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  especialidad: { type: String, required: true, trim: true },
  telefono: { type: String, trim: true },
  verificado: { type: Boolean, default: false },
  estado: { type: String, enum: ['activo', 'inactivo'], default: 'activo' }
}, { timestamps: true });

// Encriptar contraseña automáticamente antes de guardar
psicologoSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// ✅ MÉTODO AGREGADO: Para comparar contraseñas en el login
psicologoSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Psicologo', psicologoSchema);