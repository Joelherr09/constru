const pool = require('../config/database');

exports.getVivienda = async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`Buscando vivienda con id: ${id}`);
    const [viviendas] = await pool.query(`
      SELECT v.*, m.nombre as manzana_nombre
      FROM viviendas v
      JOIN manzanas m ON v.manzana_id = m.id
      WHERE v.id = ?
    `, [id]);
    if (viviendas.length === 0) {
      return res.status(404).json({ message: 'Vivienda no encontrada' });
    }
    const vivienda = viviendas[0];

    const [partidas] = await pool.query(`
      SELECT p.id as partida_id, p.nombre as partida_nombre
      FROM partidas p
    `);

    const materiales = await Promise.all(
      partidas.map(async (partida) => {
        const [mats] = await pool.query(`
          SELECT m.id as material_id, m.nombre, mt.cantidad_requerida, em.entregado, t.nombre as tarea_nombre
          FROM entrega_materiales em
          JOIN materiales m ON em.material_id = m.id
          JOIN materiales_tarea mt ON m.id = mt.material_id
          JOIN tareas t ON mt.tarea_id = t.id
          JOIN partidas p ON t.partida_id = p.id
          WHERE em.vivienda_id = ? AND p.id = ?
        `, [id, partida.partida_id]);
        return { partida_id: partida.partida_id, partida_nombre: partida.partida_nombre, materiales: mats };
      })
    );

    const progreso = await Promise.all(
      partidas.map(async (partida) => {
        const [prog] = await pool.query(`
          SELECT t.id as tarea_id, t.nombre as tarea, pc.progreso, pc.trazada, t.requiere_trazo
          FROM progreso_construccion pc
          JOIN tareas t ON pc.tarea_id = t.id
          JOIN partidas p ON t.partida_id = p.id
          WHERE pc.vivienda_id = ? AND p.id = ?
        `, [id, partida.partida_id]);
        return { partida_id: partida.partida_id, partida_nombre: partida.partida_nombre, tareas: prog };
      })
    );

    res.json({
      vivienda,
      partidas: { materiales, progreso },
    });
  } catch (error) {
    console.error('Error en getVivienda:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

exports.updateMaterial = async (req, res) => {
  const { vivienda_id, material_id, entregado } = req.body;
  try {
    await pool.query(
      'UPDATE entrega_materiales SET entregado = ? WHERE vivienda_id = ? AND material_id = ?',
      [entregado, vivienda_id, material_id]
    );
    res.json({ message: 'Material actualizado' });
  } catch (error) {
    console.error('Error en updateMaterial:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

exports.updateProgreso = async (req, res) => {
  const { vivienda_id, tarea_id, progreso, trazada } = req.body;
  try {
    await pool.query(
      'UPDATE progreso_construccion SET progreso = ?, trazada = ? WHERE vivienda_id = ? AND tarea_id = ?',
      [progreso, trazada, vivienda_id, tarea_id]
    );
    res.json({ message: 'Progreso actualizado' });
  } catch (error) {
    console.error('Error en updateProgreso:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

exports.addPartidaToVivienda = async (req, res) => {
  const { id } = req.params; // vivienda_id
  const { partida_id } = req.body;
  try {
    // Verificar que la vivienda existe
    const [viviendas] = await pool.query('SELECT id FROM Viviendas WHERE id = ?', [id]);
    if (viviendas.length === 0) {
      return res.status(404).json({ message: 'Vivienda no encontrada' });
    }

    // Verificar si la partida ya está asociada a la vivienda
    const [existingTareas] = await pool.query(
      'SELECT DISTINCT t.id FROM Tareas t ' +
      'JOIN Progreso_Construccion pc ON t.id = pc.tarea_id ' +
      'WHERE pc.vivienda_id = ? AND t.partida_id = ?',
      [id, partida_id]
    );
    if (existingTareas.length > 0) {
      return res.status(400).json({ message: 'La partida ya está asociada a esta vivienda' });
    }

    // Obtener tareas asociadas a la partida
    const [tareas] = await pool.query('SELECT id, requiere_trazo FROM Tareas WHERE partida_id = ?', [partida_id]);

    // Insertar progreso para cada tarea
    for (const tarea of tareas) {
      await pool.query(
        'INSERT INTO Progreso_Construccion (vivienda_id, tarea_id, progreso, trazada, notas) VALUES (?, ?, 0, ?, ?)',
        [id, tarea.id, tarea.requiere_trazo ? 0 : null, '']
      );

      // Obtener materiales asociados a la tarea
      const [materiales] = await pool.query(
        'SELECT material_id FROM Materiales_Tarea WHERE tarea_id = ?',
        [tarea.id]
      );

      // Insertar entrega de materiales
      for (const material of materiales) {
        await pool.query(
          'INSERT INTO Entrega_Materiales (vivienda_id, material_id, entregado) VALUES (?, ?, 0)',
          [id, material.material_id]
        );
      }
    }

    res.json({ message: 'Partida añadida a la vivienda' });
  } catch (error) {
    console.error('Error en addPartidaToVivienda:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};