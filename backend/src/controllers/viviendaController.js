const pool = require('../config/database');

exports.getVivienda = async (req, res) => {
  const { id } = req.params;
  try {
    const [viviendas] = await pool.query(`
      SELECT 
        v.id, 
        v.numero_vivienda, 
        v.tipo_vivienda,
        m.nombre AS manzana_nombre
      FROM Viviendas v
      JOIN Manzanas m ON v.manzana_id = m.id
      WHERE v.id = ?
    `, [id]);

    if (viviendas.length === 0) {
      return res.status(404).json({ message: 'Vivienda no encontrada' });
    }

    const [progreso] = await pool.query(`
      SELECT 
        p.id AS partida_id,
        p.nombre AS partida_nombre,
        t.id AS tarea_id,
        t.nombre AS tarea,
        t.requiere_trazo,
        pc.progreso,
        pc.trazada,
        pc.notas
      FROM Progreso_Construccion pc
      JOIN Tareas t ON pc.tarea_id = t.id
      JOIN Partidas p ON t.partida_id = p.id
      WHERE pc.vivienda_id = ?
      ORDER BY p.id, t.id
    `, [id]);

    const [materiales] = await pool.query(`
      SELECT 
        p.id AS partida_id,
        p.nombre AS partida_nombre,
        t.nombre AS tarea_nombre,
        m.id AS material_id,
        m.nombre,
        em.cantidad_requerida,
        em.entregado
      FROM Entrega_Materiales em
      JOIN Materiales m ON em.material_id = m.id
      JOIN Materiales_Tarea mt ON m.id = mt.material_id
      JOIN Tareas t ON mt.tarea_id = t.id
      JOIN Partidas p ON t.partida_id = p.id
      WHERE em.vivienda_id = ?
      ORDER BY p.id, t.id, m.id
    `, [id]);
    console.log('Materiales devueltos:', materiales); // Depuración

    const partidas = {
      progreso: progreso.reduce((acc, curr) => {
        const partida = acc.find((p) => p.partida_id === curr.partida_id);
        if (partida) {
          partida.tareas.push({
            tarea_id: curr.tarea_id,
            tarea: curr.tarea,
            requiere_trazo: curr.requiere_trazo,
            progreso: curr.progreso,
            trazada: curr.trazada,
            notas: curr.notas,
          });
        } else {
          acc.push({
            partida_id: curr.partida_id,
            partida_nombre: curr.partida_nombre,
            tareas: [
              {
                tarea_id: curr.tarea_id,
                tarea: curr.tarea,
                requiere_trazo: curr.requiere_trazo,
                progreso: curr.progreso,
                trazada: curr.trazada,
                notas: curr.notas,
              },
            ],
          });
        }
        return acc;
      }, []),
      materiales: materiales.reduce((acc, curr) => {
        const partida = acc.find((p) => p.partida_id === curr.partida_id);
        if (partida) {
          partida.materiales.push({
            material_id: curr.material_id,
            nombre: curr.nombre,
            cantidad_requerida: curr.cantidad_requerida,
            entregado: curr.entregado,
            tarea_nombre: curr.tarea_nombre,
          });
        } else {
          acc.push({
            partida_id: curr.partida_id,
            partida_nombre: curr.partida_nombre,
            materiales: [
              {
                material_id: curr.material_id,
                nombre: curr.nombre,
                cantidad_requerida: curr.cantidad_requerida,
                entregado: curr.entregado,
                tarea_nombre: curr.tarea_nombre,
              },
            ],
          });
        }
        return acc;
      }, []),
    };

    res.json({ vivienda: viviendas[0], partidas });
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
    console.log('Tareas encontradas:', tareas); // Depuración

    // Verificar tareas no asignadas
    const [existingTareas] = await pool.query(
      'SELECT tarea_id FROM Progreso_Construccion WHERE vivienda_id = ? AND tarea_id IN (?)',
      [id, tareas.map((t) => t.tarea_id)]
    );
    const existingTareaIds = existingTareas.map((t) => t.tarea_id);
    const newTareas = tareas.filter((t) => !existingTareaIds.includes(t.tarea_id));
    console.log('Tareas nuevas a asignar:', newTareas); // Depuración

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
      'SELECT DISTINCT mt.material_id, mt.cantidad_requerida, m.nombre FROM Materiales_Tarea mt JOIN Materiales m ON mt.material_id = m.id WHERE mt.tarea_id IN (?)',
      [newTareas.map((t) => t.tarea_id)]
    );
    console.log('Materiales encontrados:', materiales); // Depuración

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
      console.log('Materiales insertados en Entrega_Materiales:', entregaValues); // Depuración
    } else {
      console.log('No se encontraron materiales para las tareas nuevas');
    }

    await connection.commit();
    res.json({ message: 'Tareas y materiales asignados a la vivienda', materialesAsignados: materiales });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error en addTareaToVivienda:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};
