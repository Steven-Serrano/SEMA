const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSenaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  ficha: { type: String, required: true, trim: true },
  centro: { type: String, required: true, trim: true },
  rol: { type: String, default: 'administrador_sena' },
  estado: { type: String, enum: ['activo', 'inactivo'], default: 'activo' }
}, { timestamps: true });

// ✅ CORREGIDO
adminSenaSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('AdministradorSENA', adminSenaSchema);