const verificarSuperAdmin = (req, res, next) => {
  if (!req.usuario) return res.status(401).json({ error: 'Sin autenticación' });
  
  // 🔑 Aceptamos tanto 'rol' como 'tipo' para evitar conflictos
  const rolUsuario = req.usuario.rol || req.usuario.tipo;
  
  if (rolUsuario !== 'super_administrador') {
    return res.status(403).json({ error: 'Acceso denegado — se requiere rol super_administrador' });
  }
  next();
};

const verificarAdminSENA = (req, res, next) => {
  if (!req.usuario) return res.status(401).json({ error: 'Sin autenticación' });
  
  const rolUsuario = req.usuario.rol || req.usuario.tipo;
  
  if (rolUsuario !== 'administrador_sena' && rolUsuario !== 'super_administrador') {
    return res.status(403).json({ error: 'Acceso denegado — se requiere rol administrador_sena o superior' });
  }
  next();
};

module.exports = { verificarSuperAdmin, verificarAdminSENA };