const pool = require('../config/database');

exports.getTareas = async (req, res) => {
  try {
    const [tareas] = await pool.query('SELECT id, nombre, partida_id FROM Tareas');
    res.json(tareas);
  } catch (error) {
    console.error('Error en getTareas:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};