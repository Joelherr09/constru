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

exports.getManzanaById = async (req, res) => {
  const { id } = req.params;
  try {
    const [manzanas] = await pool.query('SELECT id, nombre FROM Manzanas WHERE id = ?', [id]);
    if (manzanas.length === 0) {
      return res.status(404).json({ message: 'Manzana no encontrada' });
    }
    res.json(manzanas[0]);
  } catch (error) {
    console.error('Error en getManzanaById:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

exports.getViviendasByManzana = async (req, res) => {
  const { id } = req.params;
  try {
    const [viviendas] = await pool.query(`
      SELECT 
        v.id, 
        v.numero_vivienda,
        COUNT(DISTINCT pc.tarea_id) as partidas_count,
        AVG(pc.progreso) as progreso_general
      FROM Viviendas v
      LEFT JOIN Progreso_Construccion pc ON v.id = pc.vivienda_id
      LEFT JOIN Tareas t ON pc.tarea_id = t.id
      WHERE v.manzana_id = ?
      GROUP BY v.id, v.numero_vivienda
    `, [id]);
    res.json(viviendas);
  } catch (error) {
    console.error('Error en getViviendasByManzana:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

exports.createManzana = async (req, res) => {
  const { nombre, numero_viviendas } = req.body;
  let connection;
  try {
    // Validar datos
    if (!nombre || !numero_viviendas || isNaN(numero_viviendas) || numero_viviendas < 1) {
      return res.status(400).json({ message: 'Nombre y número de viviendas son requeridos' });
    }

    // Iniciar transacción
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Crear manzana
    const [manzanaResult] = await connection.query('INSERT INTO Manzanas (nombre) VALUES (?)', [nombre]);
    const manzanaId = manzanaResult.insertId;

    // Crear viviendas
    const viviendasValues = Array.from({ length: numero_viviendas }, (_, i) => [
      `Vivienda ${i + 1}`,
      'A', // Tipo por defecto
      manzanaId,
    ]);
    await connection.query(
      'INSERT INTO Viviendas (numero_vivienda, tipo_vivienda, manzana_id) VALUES ?',
      [viviendasValues]
    );

    // Obtener IDs de las viviendas creadas
    const [viviendas] = await connection.query('SELECT id FROM Viviendas WHERE manzana_id = ?', [manzanaId]);

    // Obtener todas las tareas de todas las partidas
    const [tareas] = await connection.query('SELECT id AS tarea_id FROM Tareas');

    // Asignar todas las tareas a cada vivienda en Progreso_Construccion
    const progresoValues = [];
    for (const vivienda of viviendas) {
      for (const tarea of tareas) {
        progresoValues.push([
          vivienda.id,
          tarea.tarea_id,
          0, // Progreso inicial
          null, // Trazada inicial
          '', // Notas iniciales
        ]);
      }
    }

    if (progresoValues.length > 0) {
      await connection.query(
        'INSERT INTO Progreso_Construccion (vivienda_id, tarea_id, progreso, trazada, notas) VALUES ?',
        [progresoValues]
      );
    }

    // Confirmar transacción
    await connection.commit();
    res.json({ id: manzanaId, message: 'Manzana creada con tareas asignadas' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error en createManzana:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};