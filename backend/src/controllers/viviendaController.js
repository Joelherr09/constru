const pool = require('../config/database');

exports.getVivienda = async (req, res) => {
  const { id } = req.params;
  try {
    const [viviendas] = await pool.query(`
      SELECT v.*, m.nombre as manzana_nombre
      FROM Viviendas v
      JOIN Manzanas m ON v.manzana_id = m.id
      WHERE v.id = ?
    `, [id]);
    if (viviendas.length === 0) {
      return res.status(404).json({ message: 'Vivienda no encontrada' });
    }
    res.json(viviendas[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};