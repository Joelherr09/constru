const pool = require('../config/database');

exports.getPartidas = async (req, res) => {
  try {
    const [partidas] = await pool.query('SELECT id, nombre FROM partidas');
    res.json(partidas);
  } catch (error) {
    console.error('Error en getPartidas:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};