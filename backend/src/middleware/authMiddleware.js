const jwt = require('jsonwebtoken');

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No se proporcionó token' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Añade el usuario decodificado al request
      if (roles.length && !roles.includes(decoded.rol)) {
        return res.status(403).json({ message: 'Acceso denegado' });
      }
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token inválido', error });
    }
  };
};

module.exports = authMiddleware;