const pool = require('../config/database');


exports.getVivienda = async (req, res) => {
  const { id } = req.params;
  try {
    const [viviendas] = await pool.query(
      `
      SELECT 
        v.id, 
        v.numero_vivienda, 
        v.tipo_vivienda,
        m.nombre AS manzana_nombre
      FROM Viviendas v
      JOIN Manzanas m ON v.manzana_id = m.id
      WHERE v.id = ?
    `,
      [id]
    );
    if (viviendas.length === 0) {
      return res.status(404).json({ message: 'Vivienda no encontrada' });
    }
    const [progreso] = await pool.query(
      `
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
    `,
      [id]
    );
    const [materiales] = await pool.query(
      `
      SELECT 
        p.id AS partida_id,
        p.nombre AS partida_nombre,
        t.id AS tarea_id,
        t.nombre AS tarea_nombre,
        m.id AS material_id,
        m.nombre,
        mt.cantidad_requerida,
        em.entregado,
        em.fecha_entrega
      FROM Entrega_Materiales em
      JOIN Materiales m ON em.material_id = m.id
      JOIN Tareas t ON em.vivienda_id = ?  -- Join Tareas via Progreso_Construccion to ensure valid tasks
      JOIN Materiales_Tarea mt ON mt.material_id = m.id AND mt.tarea_id = t.id
      JOIN Partidas p ON t.partida_id = p.id
      WHERE em.vivienda_id = ?
      ORDER BY p.id, t.id, m.id
    `,
      [id, id]
    );
    console.log('Materiales devueltos:', materiales);
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
            tarea_id: curr.tarea_id,
            tarea_nombre: curr.tarea_nombre,
            fecha_entrega: curr.fecha_entrega,
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
                tarea_id: curr.tarea_id,
                tarea_nombre: curr.tarea_nombre,
                fecha_entrega: curr.fecha_entrega,
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

exports.getViviendaById = async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();

    // Obtener datos de la vivienda
    const [vivienda] = await connection.query(
      'SELECT v.id, v.numero_vivienda, m.nombre AS manzana_nombre ' +
      'FROM Viviendas v ' +
      'JOIN Manzanas m ON v.manzana_id = m.id ' +
      'WHERE v.id = ?',
      [id]
    );

    if (!vivienda.length) {
      return res.status(404).json({ message: 'Vivienda no encontrada' });
    }

    // Obtener progreso de tareas
    const [progreso] = await connection.query(
      'SELECT p.partida_id, p.nombre AS partida_nombre, ' +
      't.id AS tarea_id, t.nombre AS tarea, pc.progreso, pc.trazada, pc.notas, t.requiere_trazo ' +
      'FROM Progreso_Construccion pc ' +
      'JOIN Tareas t ON pc.tarea_id = t.id ' +
      'JOIN Partidas p ON t.partida_id = p.id ' +
      'WHERE pc.vivienda_id = ? ' +
      'ORDER BY p.partida_id, t.id',
      [id]
    );

    // Obtener materiales, asegurando unicidad
    const [materiales] = await connection.query(
      'SELECT p.partida_id, p.nombre AS partida_nombre, t.id AS tarea_id, t.nombre AS tarea_nombre, ' +
      'm.id AS material_id, m.nombre, SUM(em.cantidad) AS cantidad_requerida, MIN(em.entregado) AS entregado, MAX(em.fecha_entrega) AS fecha_entrega ' +
      'FROM Entrega_Materiales em ' +
      'JOIN Materiales m ON em.material_id = m.id ' +
      'JOIN Materiales_Tarea mt ON m.id = mt.material_id AND mt.tarea_id = t.id ' +
      'JOIN Tareas t ON mt.tarea_id = t.id ' +
      'JOIN Partidas p ON t.partida_id = p.id ' +
      'WHERE em.vivienda_id = ? ' +
      'GROUP BY p.partida_id, t.id, m.id, m.nombre ' +
      'ORDER BY p.partida_id, t.id, m.id',
      [id]
    );

    // Estructurar los datos
    const partidasMap = {};
    progreso.forEach((row) => {
      if (!partidasMap[row.partida_id]) {
        partidasMap[row.partida_id] = {
          partida_id: row.partida_id,
          partida_nombre: row.partida_nombre,
          tareas: [],
        };
      }
      partidasMap[row.partida_id].tareas.push({
        tarea_id: row.tarea_id,
        tarea: row.tarea,
        progreso: row.progreso,
        trazada: row.trazada,
        notas: row.notas,
        requiere_trazo: row.requiere_trazo,
      });
    });

    const materialesMap = {};
    materiales.forEach((row) => {
      if (!materialesMap[row.partida_id]) {
        materialesMap[row.partida_id] = {
          partida_id: row.partida_id,
          partida_nombre: row.partida_nombre,
          materiales: [],
        };
      }
      materialesMap[row.partida_id].materiales.push({
        tarea_id: row.tarea_id,
        tarea_nombre: row.tarea_nombre,
        material_id: row.material_id,
        nombre: row.nombre,
        cantidad_requerida: row.cantidad_requerida,
        entregado: row.entregado,
        fecha_entrega: row.fecha_entrega,
      });
    });

    res.json({
      vivienda: vivienda[0],
      partidas: {
        progreso: Object.values(partidasMap),
        materiales: Object.values(materialesMap),
      },
    });
  } catch (error) {
    console.error('Error en getViviendaById:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  } finally {
    if (connection) connection.release();
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
  const vivienda_id = req.params.id;
  const { material_id, entregado } = req.body;
  let connection;

  try {
    console.log('Received updateMaterial request:', { vivienda_id, material_id, entregado });

    // Validate input
    if (!vivienda_id || !material_id) {
      return res.status(400).json({ message: 'vivienda_id y material_id son requeridos' });
    }
    if (typeof entregado !== 'boolean') {
      return res.status(400).json({ message: 'entregado debe ser un booleano' });
    }

    connection = await pool.getConnection();

    // Check if vivienda exists
    const [viviendaRows] = await connection.query('SELECT * FROM Viviendas WHERE id = ?', [vivienda_id]);
    if (viviendaRows.length === 0) {
      return res.status(404).json({ message: 'Vivienda no encontrada' });
    }

    // Check if material record exists
    const [materialRows] = await connection.query(
      'SELECT * FROM Entrega_Materiales WHERE vivienda_id = ? AND material_id = ?',
      [vivienda_id, material_id]
    );
    if (materialRows.length === 0) {
      return res.status(404).json({ message: 'Registro de material no encontrado para esta vivienda' });
    }

    // Update material
    const [result] = await connection.query(
      'UPDATE Entrega_Materiales SET entregado = ?, fecha_entrega = ? WHERE vivienda_id = ? AND material_id = ?',
      [entregado, entregado ? new Date() : null, vivienda_id, material_id]
    );

    console.log('Update result:', result);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se pudo actualizar el material, verifica los IDs' });
    }

    await connection.commit();
    res.json({ message: 'Material actualizado correctamente' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error en updateMaterial:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.updateProgreso = async (req, res) => {
  const vivienda_id = req.params.id; // Get vivienda_id from URL
  const { tarea_id, progreso, trazada, notas } = req.body;
  let connection;

  try {
    console.log('Received updateProgreso request:', { vivienda_id, tarea_id, progreso, trazada, notas });

    // Validate input
    if (!vivienda_id || !tarea_id) {
      return res.status(400).json({ message: 'vivienda_id y tarea_id son requeridos' });
    }
    if (isNaN(progreso) || progreso < 0 || progreso > 100) {
      return res.status(400).json({ message: 'El progreso debe ser un número entre 0 y 100' });
    }

    connection = await pool.getConnection();

    // Check if vivienda exists
    const [viviendaRows] = await connection.query('SELECT * FROM Viviendas WHERE id = ?', [vivienda_id]);
    if (viviendaRows.length === 0) {
      return res.status(404).json({ message: 'Vivienda no encontrada' });
    }

    // Check if progreso record exists
    const [progresoRows] = await connection.query(
      'SELECT * FROM Progreso_Construccion WHERE vivienda_id = ? AND tarea_id = ?',
      [vivienda_id, tarea_id]
    );
    if (progresoRows.length === 0) {
      return res.status(404).json({ message: 'Registro de progreso no encontrado para esta vivienda y tarea' });
    }

    // Update progreso
    const [result] = await connection.query(
      'UPDATE Progreso_Construccion SET progreso = ?, trazada = ?, notas = ? WHERE vivienda_id = ? AND tarea_id = ?',
      [progreso, trazada, notas, vivienda_id, tarea_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se pudo actualizar el progreso, verifica los IDs' });
    }

    await connection.commit();
    res.json({ message: 'Progreso actualizado correctamente' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error en updateProgreso:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.addPartidaToVivienda = async (req, res) => {
  const { id } = req.params;
  const { partida_id } = req.body;
  let connection;
  try {
    if (!partida_id) {
      return res.status(400).json({ message: 'Partida ID es requerido' });
    }
    const [viviendas] = await pool.query('SELECT id FROM Viviendas WHERE id = ?', [id]);
    if (viviendas.length === 0) {
      return res.status(404).json({ message: 'Vivienda no encontrada' });
    }
    const [partidas] = await pool.query('SELECT id FROM Partidas WHERE id = ?', [partida_id]);
    if (partidas.length === 0) {
      return res.status(404).json({ message: 'Partida no encontrada' });
    }
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [existingProgreso] = await pool.query(
      'SELECT tarea_id FROM Progreso_Construccion pc JOIN Tareas t ON pc.tarea_id = t.id WHERE pc.vivienda_id = ? AND t.partida_id = ?',
      [id, partida_id]
    );
    if (existingProgreso.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'La partida ya está asignada a esta vivienda' });
    }
    const [tareas] = await pool.query('SELECT id AS tarea_id FROM Tareas WHERE partida_id = ?', [partida_id]);
    if (tareas.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'No hay tareas asociadas a esta partida' });
    }
    const progresoValues = tareas.map((tarea) => [id, tarea.tarea_id, 0, null, '']);
    await connection.query(
      'INSERT INTO Progreso_Construccion (vivienda_id, tarea_id, progreso, trazada, notas) VALUES ?',
      [progresoValues]
    );
    const [materiales] = await connection.query(
      'SELECT DISTINCT mt.material_id, mt.cantidad_requerida, m.nombre, mt.tarea_id FROM Materiales_Tarea mt JOIN Materiales m ON mt.material_id = m.id WHERE mt.tarea_id IN (?)',
      [tareas.map((t) => t.tarea_id)]
    );
    if (materiales.length > 0) {
      const entregaValues = materiales.map((material) => [
        id,
        material.material_id,
        false,
        null,
      ]);
      await connection.query(
        'INSERT INTO Entrega_Materiales (vivienda_id, material_id, entregado, fecha_entrega) VALUES ?',
        [entregaValues]
      );
    }
    await connection.commit();
    res.json({ message: 'Partida y tareas asignadas a la vivienda' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error en addPartidaToVivienda:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.addTareaToVivienda = async (req, res) => {
  const { id } = req.params;
  const { partida_id } = req.body;
  let connection;
  try {
    if (!partida_id) {
      return res.status(400).json({ message: 'Partida ID es requerido' });
    }
    const [viviendas] = await pool.query('SELECT id FROM Viviendas WHERE id = ?', [id]);
    if (viviendas.length === 0) {
      return res.status(404).json({ message: 'Vivienda no encontrada' });
    }
    const [partidas] = await pool.query('SELECT id FROM Partidas WHERE id = ?', [partida_id]);
    if (partidas.length === 0) {
      return res.status(404).json({ message: 'Partida no encontrada' });
    }
    const [tareas] = await pool.query('SELECT id AS tarea_id FROM Tareas WHERE partida_id = ?', [partida_id]);
    console.log('Tareas encontradas:', tareas);
    const [existingTareas] = await pool.query(
      'SELECT tarea_id FROM Progreso_Construccion WHERE vivienda_id = ? AND tarea_id IN (?)',
      [id, tareas.map((t) => t.tarea_id)]
    );
    const existingTareaIds = existingTareas.map((t) => t.tarea_id);
    const newTareas = tareas.filter((t) => !existingTareaIds.includes(t.tarea_id));
    console.log('Tareas nuevas a asignar:', newTareas);
    if (newTareas.length === 0) {
      return res.status(400).json({ message: 'Todas las tareas de esta partida ya están asignadas' });
    }
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const progresoValues = newTareas.map((tarea) => [id, tarea.tarea_id, 0, null, '']);
    await connection.query(
      'INSERT INTO Progreso_Construccion (vivienda_id, tarea_id, progreso, trazada, notas) VALUES ?',
      [progresoValues]
    );
    const [materiales] = await connection.query(
      'SELECT DISTINCT mt.material_id, mt.cantidad_requerida, m.nombre, mt.tarea_id FROM Materiales_Tarea mt JOIN Materiales m ON mt.material_id = m.id WHERE mt.tarea_id IN (?)',
      [newTareas.map((t) => t.tarea_id)]
    );
    console.log('Materiales encontrados:', materiales);
    if (materiales.length > 0) {
      const entregaValues = materiales.map((material) => [
        id,
        material.material_id,
        false,
        null,
      ]);
      await connection.query(
        'INSERT INTO Entrega_Materiales (vivienda_id, material_id, entregado, fecha_entrega) VALUES ?',
        [entregaValues]
      );
      console.log('Materiales insertados en Entrega_Materiales:', entregaValues);
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