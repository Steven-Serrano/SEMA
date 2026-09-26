const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({

    id: {
        type: String,
        required: true
    },

    nombre: {
        type: String,
        required: true
    },

    apellido: {
        type: String,
        required: true
    },

    correo: {
        type: String,
        required: true,
        unique: true
    },

    contraseña: {
        type: String,
        required: true
    },

    telefono: {
        type: String
    },

    fecha_nacimiento: {
        type: Date
    },

    tipo_usuario: {
        type: String,
        required: true,
        enum: ["usuario", "psicologo", "administrador"]
    },

    rol: {
        type: String,
        enum: ["admin", "usuario"],
        default: "usuario"
    }

});

// Schema de usuario
module.exports = mongoose.model("Usuario", usuarioSchema);