const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const superAdminSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  rol: { type: String, default: 'super_administrador' },
  permisos: [{ type: String }],
  estado: { type: String, enum: ['activo', 'inactivo'], default: 'activo' },
  fechaCreacion: { type: Date, default: Date.now }
}, { timestamps: true });

// ✅ CORREGIDO
superAdminSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('SuperAdministrador', superAdminSchema);