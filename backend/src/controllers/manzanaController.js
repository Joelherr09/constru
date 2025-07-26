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
exports.getAllManzanas = async (req, res) => {
  try {
    const [manzanas] = await db.query('SELECT * FROM manzanas');
    res.json(manzanas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las manzanas' });
  }
};

exports.getViviendasByManzana = async (req, res) => {
  try {
    const { id } = req.params;
    const [viviendas] = await db.query(`
      SELECT 
        v.id,
        v.numero_vivienda,
        v.manzana_id,
        COUNT(DISTINCT pt.partida_id) as partidas_count,
        COUNT(DISTINCT CASE WHEN t.progreso = 100 THEN t.tarea_id END) as tareas_completadas,
        COUNT(DISTINCT t.tarea_id) as tareas_totales
      FROM viviendas v
      LEFT JOIN partidas_tareas pt ON v.id = pt.vivienda_id
      LEFT JOIN tareas t ON pt.tarea_id = t.id
      WHERE v.manzana_id = ?
      GROUP BY v.id
    `, [id]);
    
    res.json(viviendas.map(v => ({
      ...v,
      progreso_general: v.tareas_totales > 0 
        ? Math.round((v.tareas_completadas / v.tareas_totales) * 100)
        : 0
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las viviendas' });
  }
};