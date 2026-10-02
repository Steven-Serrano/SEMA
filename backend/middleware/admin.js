function verificarAdmin(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({ error: 'Sin autenticación' });
  }

  // Corregido para coincidir con la guía ADSO
  if (req.usuario.rol !== 'super_administrador') {
    return res.status(403).json({ error: 'Acceso denegado — se requiere rol super_administrador' });
  }

  next();
}

module.exports = verificarAdmin;