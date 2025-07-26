const pool = require('../config/database');

exports.getVivienda = async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`Buscando vivienda con id: ${id}`);
    const [viviendas] = await pool.query(`
      SELECT v.*, m.nombre as manzana_nombre
      FROM Viviendas v
      JOIN Manzanas m ON v.manzana_id = m.id
      WHERE v.id = ?
    `, [id]);
    if (viviendas.length === 0) {
      return res.status(404).json({ message: 'Vivienda no encontrada' });
    }
    const vivienda = viviendas[0];

    const [partidas] = await pool.query(`
      SELECT p.id as partida_id, p.nombre as partida_nombre
      FROM Partidas p
    `);

    const materiales = await Promise.all(
      partidas.map(async (partida) => {
        const [mats] = await pool.query(`
          SELECT m.id as material_id, m.nombre, mt.cantidad_requerida, em.entregado, t.nombre as tarea_nombre
          FROM Entrega_Materiales em
          JOIN Materiales m ON em.material_id = m.id
          JOIN Materiales_Tarea mt ON m.id = mt.material_id
          JOIN Tareas t ON mt.tarea_id = t.id
          JOIN Partidas p ON t.partida_id = p.id
          WHERE em.vivienda_id = ? AND p.id = ?
        `, [id, partida.partida_id]);
        return { partida_id: partida.partida_id, partida_nombre: partida.partida_nombre, materiales: mats };
      })
    );

    const progreso = await Promise.all(
      partidas.map(async (partida) => {
        const [prog] = await pool.query(`
          SELECT t.id as tarea_id, t.nombre as tarea, pc.progreso, pc.trazada, pc.notas, t.requiere_trazo
          FROM Progreso_Construccion pc
          JOIN Tareas t ON pc.tarea_id = t.id
          JOIN Partidas p ON t.partida_id = p.id
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

exports.updateVivienda = async (req, res) => {
  const { id } = req.params;
  const { numero_vivienda, tipo_vivienda } = req.body;
  try {
    // Verificar que la vivienda existe
    const [viviendas] = await pool.query('SELECT id FROM Viviendas WHERE id = ?', [id]);
    if (viviendas.length === 0) {
      return res.status(404).json({ message: 'Vivienda no encontrada' });
    }

    // Validar tipo_vivienda
    const validTypes = ['A', 'B', 'C'];
    if (tipo_vivienda && !validTypes.includes(tipo_vivienda)) {
      return res.status(400).json({ message: 'Tipo de vivienda inválido' });
    }

    // Actualizar vivienda
    await pool.query(
      'UPDATE Viviendas SET numero_vivienda = ?, tipo_vivienda = ? WHERE id = ?',
      [numero_vivienda, tipo_vivienda, id]
    );

    res.json({ message: 'Vivienda actualizada' });
  } catch (error) {
    console.error('Error en updateVivienda:', error);
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
  const { vivienda_id, tarea_id, progreso, trazada, notas } = req.body;
  try {
    await pool.query(
      'UPDATE Progreso_Construccion SET progreso = ?, trazada = ?, notas = ? WHERE vivienda_id = ? AND tarea_id = ?',
      [progreso, trazada, notas, vivienda_id, tarea_id]
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

exports.addTareaToVivienda = async (req, res) => {
  const { id } = req.params;
  const { partida_id } = req.body;
  let connection;
  try {
    // Validar datos
    if (!partida_id) {
      return res.status(400).json({ message: 'Partida ID es requerido' });
    }

    // Verificar que la vivienda existe
    const [viviendas] = await pool.query('SELECT id FROM Viviendas WHERE id = ?', [id]);
    if (viviendas.length === 0) {
      return res.status(404).json({ message: 'Vivienda no encontrada' });
    }

    // Verificar que la partida existe
    const [partidas] = await pool.query('SELECT id FROM Partidas WHERE id = ?', [partida_id]);
    if (partidas.length === 0) {
      return res.status(404).json({ message: 'Partida no encontrada' });
    }

    // Obtener tareas de la partida
    const [tareas] = await pool.query('SELECT id AS tarea_id FROM Tareas WHERE partida_id = ?', [partida_id]);

    // Verificar tareas no asignadas
    const [existingTareas] = await pool.query(
      'SELECT tarea_id FROM Progreso_Construccion WHERE vivienda_id = ? AND tarea_id IN (?)',
      [id, tareas.map((t) => t.tarea_id)]
    );
    const existingTareaIds = existingTareas.map((t) => t.tarea_id);
    const newTareas = tareas.filter((t) => !existingTareaIds.includes(t.tarea_id));

    if (newTareas.length === 0) {
      return res.status(400).json({ message: 'Todas las tareas de esta partida ya están asignadas' });
    }

    // Iniciar transacción
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Asignar tareas nuevas
    const progresoValues = newTareas.map((tarea) => [
      id,
      tarea.tarea_id,
      0, // Progreso inicial
      null, // Trazada inicial
      '', // Notas iniciales
    ]);
    await connection.query(
      'INSERT INTO Progreso_Construccion (vivienda_id, tarea_id, progreso, trazada, notas) VALUES ?',
      [progresoValues]
    );

    // Obtener materiales asociados a las tareas nuevas
    const [materiales] = await connection.query(
      'SELECT DISTINCT material_id, cantidad_requerida FROM Materiales_Tarea WHERE tarea_id IN (?)',
      [newTareas.map((t) => t.tarea_id)]
    );

    // Asignar materiales a la vivienda
    if (materiales.length > 0) {
      const entregaValues = materiales.map((material) => [
        id,
        material.material_id,
        material.cantidad_requerida,
        false, // Entregado inicial
      ]);
      await connection.query(
        'INSERT INTO Entrega_Materiales (vivienda_id, material_id, cantidad_requerida, entregado) VALUES ?',
        [entregaValues]
      );
    }

    await connection.commit();
    res.json({ message: 'Tareas y materiales asignados a la vivienda' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error en addTareaToVivienda:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};
