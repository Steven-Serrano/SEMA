// backend/middleware/auth.js

const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  // El token llega en el header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Acceso denegado — token requerido'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Información del usuario disponible en las rutas protegidas
    req.usuario = decoded;

    next();

  } catch (err) {
    res.status(403).json({
      error: 'Token inválido o expirado'
    });
  }
}

module.exports = verificarToken;