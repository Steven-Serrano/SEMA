const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
    id: { type: Number, required: true},

    nombre: { type: String, required: true},

    apellido: {type: String, required: true},

    correo: { type: String, required: true, unique: true},

    contraseña: { type: String, required: true},

    telofono: { type: String},

    fecha_nacimiento: { type: Date, required: true},

    tipo_usuario: {type: String, required: true, enum: ["usuario", "psicologo", "administrador"]},

    rol: {type: String, enum: ['admin', 'usuario'], default: 'usuario'}
    
});


// schema de usuario

module.exports = mongoose.model("Usuario", usuarioSchema);