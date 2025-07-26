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
    res.status(500).json({ 
      message: 'Error en el servidor', 
      error: error.message,
      stack: error.stack // Para más detalles en desarrollo
    });
  }
};

exports.getViviendasByManzana = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'ID de manzana inválido' });
    }

    // Primero verifica si la manzana existe
    const [manzana] = await pool.query('SELECT * FROM Manzanas WHERE id = ?', [id]);
    if (manzana.length === 0) {
      return res.status(404).json({ message: 'Manzana no encontrada' });
    }

    // Consulta simplificada paso a paso
    // 1. Obtener viviendas básicas
    const [viviendas] = await pool.query(
      'SELECT id, numero_vivienda FROM Viviendas WHERE manzana_id = ?', 
      [id]
    );

    // 2. Para cada vivienda, obtener sus métricas
    const viviendasConProgreso = await Promise.all(
      viviendas.map(async (vivienda) => {
        const [partidas] = await pool.query(
          'SELECT COUNT(*) as count FROM tareas WHERE vivienda_id = ?',
          [vivienda.id]
        );
        
        const [tareas] = await pool.query(
          `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN progreso = 100 THEN 1 ELSE 0 END) as completadas
           FROM tareas t
           JOIN tareas pt ON t.id = pt.tarea_id
           WHERE pt.vivienda_id = ?`,
          [vivienda.id]
        );

        return {
          ...vivienda,
          partidas_count: partidas[0].count,
          tareas_totales: tareas[0].total,
          tareas_completadas: tareas[0].completadas,
          progreso_general: tareas[0].total > 0 
            ? Math.round((tareas[0].completadas / tareas[0].total) * 100)
            : 0
        };
      })
    );

    res.json(viviendasConProgreso);
  } catch (error) {
    console.error('Error en getViviendasByManzana:', error);
    res.status(500).json({ 
      message: 'Error al obtener viviendas',
      error: error.message,
      stack: error.stack // Solo para desarrollo
    });
  }
};