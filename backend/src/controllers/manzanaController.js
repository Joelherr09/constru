const pool = require('../config/database');

exports.getManzanas = async (req, res) => {
  try {
    const [manzanas] = await pool.query(`
      SELECT m.*, COUNT(v.id) as viviendas_count
      FROM Manzanas m
      LEFT JOIN Viviendas v ON m.id = v.manzana_id
      GROUP BY m.id
    `);
    res.json(manzanas);
  } catch (error) {
    console.error('Get manzanas error:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};