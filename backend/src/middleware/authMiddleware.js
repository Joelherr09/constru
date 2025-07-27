const jwt = require('jsonwebtoken');

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (roles.length && !roles.includes(decoded.rol)) {
        return res.status(403).json({ message: 'Acceso denegado: rol no autorizado' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token inválido', error: error.message });
    }
  };
};

module.exports = authMiddleware;