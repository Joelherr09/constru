const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log('Attempting login for email:', email); // Debug log
    const [users] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    console.log('Query result:', users); // Debug log
    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.contraseña);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ id: user.id, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, nombre: user.nombre, rol: user.rol } });
  } catch (error) {
    console.error('Login error:', error); // Log detailed error
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Registro (solo para administradores o para pruebas iniciales)
exports.register = async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  try {
    const [existingUsers] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO Usuarios (nombre, email, contraseña, rol) VALUES (?, ?, ?, ?)', [
      nombre,
      email,
      hashedPassword,
      rol || 'normal', // Por defecto, usuario normal
    ]);
    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};