const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  documento: {
    type: String,
    required: [true, 'El documento es obligatorio'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: 6
  },
  telefono: {
    type: String,
    default: ''
  },
  ciudad: {
    type: String,
    default: ''
  },
  fechaNacimiento: {
    type: Date,
    default: null
  },
  genero: {
    type: String,
    enum: ['Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo'],
    default: 'Prefiero no decirlo'
  },
  biografia: {
    type: String,
    default: '',
    maxlength: 500
  },
  fotoPerfil: {
    type: String,
    default: ''
  },
  numeroFicha: {
    type: String,
    required: [true, 'El número de ficha es obligatorio'],
    trim: true
  },
  programaFormacion: {
    type: String,
    required: [true, 'El programa de formación es obligatorio'],
    trim: true
  },
  rol: {
    type: String,
    enum: ['usuario', 'psicologo', 'administrador'],
    default: 'usuario'
  },
  activo: {
    type: Boolean,
    default: true
  },
  edad: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ==========================================
// MIDDLEWARE PARA ENCRIPTAR CONTRASEÑA (CORREGIDO)
// ==========================================
// En Mongoose moderno, si usas 'async', NO uses el parámetro 'next'
UsuarioSchema.pre('save', async function() {
  // Solo encriptar si la contraseña fue modificada o es nueva
  if (!this.isModified('password')) return;
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw new Error('Error al encriptar la contraseña: ' + error.message);
  }
});

// Método para comparar contraseñas
UsuarioSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Usuario', UsuarioSchema);