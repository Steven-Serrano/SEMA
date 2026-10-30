require('dotenv').config();
const mongoose = require('mongoose');
const AdministradorSENA = require('./models/AdministradorSENA');
const SuperAdministrador = require('./models/SuperAdministrador');

const crearAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB...');

    // Limpiar si ya existen para evitar errores de duplicado
    await AdministradorSENA.deleteOne({ email: 'admin@sema.com' });
    await SuperAdministrador.deleteOne({ email: 'superadmin@sema.com' });

    // Crear Admin SENA
    const adminSena = new AdministradorSENA({
      nombre: 'Coordinador Bienestar SENA',
      email: 'admin@sema.com',
      password: 'admin123',
      ficha: '123456',
      centro: 'Centro de Formación SENA'
    });
    await adminSena.save();
    console.log('✅ Administrador SENA creado');

    // Crear Super Admin
    const superAdmin = new SuperAdministrador({
      nombre: 'Soporte TI SENA',
      email: 'superadmin@sema.com',
      password: 'super123'
    });
    await superAdmin.save();
    console.log('✅ Super Administrador creado');

    console.log('¡Proceso terminado con éxito!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

crearAdmins();
