const jwt = require('jsonwebtoken');

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('Auth Header:', authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No se proporcionó token' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decodificado:', decoded);
      req.user = decoded;
      if (roles.length && !roles.includes(decoded.rol)) {
        return res.status(403).json({ message: 'Acceso denegado' });
      }
      next();
    } catch (error) {
      console.error('Error en authMiddleware:', error);
      return res.status(401).json({ message: 'Token inválido', error: error.message });
    }
  };
};

module.exports = authMiddleware;