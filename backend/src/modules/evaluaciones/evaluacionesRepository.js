import { query, getClient } from "../../config/db.js";
import { logger } from "../../utils/logger.js";

// ==========================================
// 1. PERIODOS DE EVALUACIÓN
// ==========================================

export const createPeriodo = async ({
  nombre,
  fecha_inicio,
  fecha_fin,
  duracion_meses = 6,
  estado = "abierto",
}) => {
  try {
    const sql = `
      INSERT INTO public.periodos_evaluacion (nombre, fecha_inicio, fecha_fin, duracion_meses, estado)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, fecha_inicio, fecha_fin, duracion_meses, estado, fecha_creacion;
    `;
    const res = await query(sql, [
      nombre,
      fecha_inicio,
      fecha_fin,
      duracion_meses,
      estado,
    ]);
    return res.rows[0];
  } catch (err) {
    logger.error({ err, nombre }, "Error en createPeriodo");
    throw new Error("Error al crear el periodo de evaluación");
  }
};

export const getPeriodos = async ({ limit = 10, offset = 0, estado = null }) => {
  try {
    const lim = Number(limit) || 10;
    const off = Number(offset) || 0;

    let sql = `
      SELECT
        p.id, p.nombre, p.fecha_inicio, p.fecha_fin, p.duracion_meses, p.estado, p.fecha_creacion,
        COUNT(*) OVER() AS total_count
      FROM public.periodos_evaluacion p
    `;
    const params = [];
    const conditions = [];

    if (estado) {
      params.push(estado);
      conditions.push(`p.estado = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    params.push(lim);
    sql += ` ORDER BY p.fecha_inicio DESC LIMIT $${params.length}`;

    params.push(off);
    sql += ` OFFSET $${params.length};`;

    const res = await query(sql, params);
    const total = res.rows.length > 0 ? parseInt(res.rows[0].total_count, 10) : 0;
    const data = res.rows.map(({ total_count, ...p }) => p);

    return { data, total };
  } catch (err) {
    logger.error({ err }, "Error en getPeriodos");
    throw new Error("Error al consultar los periodos de evaluación");
  }
};

export const getPeriodoById = async (id) => {
  try {
    const sql = `
      SELECT id, nombre, fecha_inicio, fecha_fin, duracion_meses, estado, fecha_creacion
      FROM public.periodos_evaluacion
      WHERE id = $1;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en getPeriodoById");
    throw new Error("Error al consultar el periodo por ID");
  }
};

export const updatePeriodo = async (id, updateData) => {
  try {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = ["nombre", "fecha_inicio", "fecha_fin", "duracion_meses", "estado"];
    for (const field of allowed) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = $${idx}`);
        values.push(updateData[field]);
        idx++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const sql = `
      UPDATE public.periodos_evaluacion
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING id, nombre, fecha_inicio, fecha_fin, duracion_meses, estado, fecha_creacion;
    `;
    const res = await query(sql, values);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id, updateData }, "Error en updatePeriodo");
    throw new Error("Error al actualizar el periodo de evaluación");
  }
};

export const updateEstadoPeriodo = async (id, estado) => {
  try {
    const sql = `
      UPDATE public.periodos_evaluacion
      SET estado = $1
      WHERE id = $2
      RETURNING id, nombre, estado;
    `;
    const res = await query(sql, [estado, id]);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id, estado }, "Error en updateEstadoPeriodo");
    throw new Error("Error al actualizar el estado del periodo");
  }
};

// ==========================================
// 2. CRITERIOS DE EVALUACIÓN (CATÁLOGO BASE)
// ==========================================

export const createCriterio = async ({
  nombre,
  descripcion = null,
  activo = true,
  orden = 1,
}) => {
  try {
    const sql = `
      INSERT INTO public.criterios_evaluacion (nombre, descripcion, activo, orden)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nombre, descripcion, activo, orden;
    `;
    const res = await query(sql, [nombre, descripcion, activo, orden]);
    return res.rows[0];
  } catch (err) {
    logger.error({ err, nombre }, "Error en createCriterio");
    if (err.code === "23505") {
      throw new Error("Ya existe un criterio de evaluación con este nombre");
    }
    throw new Error("Error al registrar el criterio de evaluación");
  }
};

export const getCriterios = async ({ activo = null } = {}) => {
  try {
    let sql = `
      SELECT id, nombre, descripcion, activo, orden
      FROM public.criterios_evaluacion
    `;
    const params = [];
    if (activo !== null && activo !== undefined) {
      params.push(activo);
      sql += ` WHERE activo = $1`;
    }
    sql += ` ORDER BY orden ASC, nombre ASC;`;

    const res = await query(sql, params);
    return res.rows;
  } catch (err) {
    logger.error({ err }, "Error en getCriterios");
    throw new Error("Error al consultar los criterios de evaluación");
  }
};

export const getCriterioById = async (id) => {
  try {
    const sql = `
      SELECT id, nombre, descripcion, activo, orden
      FROM public.criterios_evaluacion
      WHERE id = $1;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en getCriterioById");
    throw new Error("Error al consultar criterio por ID");
  }
};

export const updateCriterio = async (id, updateData) => {
  try {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = ["nombre", "descripcion", "activo", "orden"];
    for (const field of allowed) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = $${idx}`);
        values.push(updateData[field]);
        idx++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const sql = `
      UPDATE public.criterios_evaluacion
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING id, nombre, descripcion, activo, orden;
    `;
    const res = await query(sql, values);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id, updateData }, "Error en updateCriterio");
    if (err.code === "23505") {
      throw new Error("Ya existe otro criterio con ese nombre");
    }
    throw new Error("Error al actualizar el criterio de evaluación");
  }
};

export const deleteCriterio = async (id) => {
  try {
    const sql = `
      DELETE FROM public.criterios_evaluacion
      WHERE id = $1
      RETURNING id, nombre;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en deleteCriterio");
    throw new Error("No se puede eliminar el criterio porque está referenciado en evaluaciones o periodos");
  }
};

// ==========================================
// 3. CRITERIOS POR PERIODO
// ==========================================

export const addCriterioPeriodo = async ({
  id_periodo,
  id_criterio,
  ponderacion,
  puntuacion_maxima = 100,
  orden = 1,
}) => {
  try {
    const sql = `
      INSERT INTO public.criterios_periodo_evaluacion
        (id_periodo, id_criterio, ponderacion, puntuacion_maxima, orden)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, id_periodo, id_criterio, ponderacion, puntuacion_maxima, orden;
    `;
    const res = await query(sql, [
      id_periodo,
      id_criterio,
      ponderacion,
      puntuacion_maxima,
      orden,
    ]);
    return res.rows[0];
  } catch (err) {
    logger.error({ err, id_periodo, id_criterio }, "Error en addCriterioPeriodo");
    if (err.code === "23505") {
      throw new Error("Este criterio ya ha sido asignado al periodo");
    }
    throw new Error("Error al asignar el criterio al periodo");
  }
};

export const getCriteriosByPeriodoId = async (id_periodo) => {
  try {
    const sql = `
      SELECT
        cp.id, cp.id_periodo, cp.id_criterio, cp.ponderacion, cp.puntuacion_maxima, cp.orden,
        c.nombre AS criterio_nombre, c.descripcion AS criterio_descripcion
      FROM public.criterios_periodo_evaluacion cp
      JOIN public.criterios_evaluacion c ON c.id = cp.id_criterio
      WHERE cp.id_periodo = $1
      ORDER BY cp.orden ASC, c.nombre ASC;
    `;
    const res = await query(sql, [id_periodo]);
    return res.rows;
  } catch (err) {
    logger.error({ err, id_periodo }, "Error en getCriteriosByPeriodoId");
    throw new Error("Error al consultar criterios del periodo");
  }
};

export const getSumPonderacionByPeriodo = async (id_periodo) => {
  try {
    const sql = `
      SELECT COALESCE(SUM(ponderacion), 0) AS total_ponderacion
      FROM public.criterios_periodo_evaluacion
      WHERE id_periodo = $1;
    `;
    const res = await query(sql, [id_periodo]);
    return parseFloat(res.rows[0].total_ponderacion);
  } catch (err) {
    logger.error({ err, id_periodo }, "Error en getSumPonderacionByPeriodo");
    throw new Error("Error al calcular total de ponderación");
  }
};

export const updateCriterioPeriodo = async (id, updateData) => {
  try {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = ["ponderacion", "puntuacion_maxima", "orden"];
    for (const field of allowed) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = $${idx}`);
        values.push(updateData[field]);
        idx++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const sql = `
      UPDATE public.criterios_periodo_evaluacion
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING id, id_periodo, id_criterio, ponderacion, puntuacion_maxima, orden;
    `;
    const res = await query(sql, values);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id, updateData }, "Error en updateCriterioPeriodo");
    throw new Error("Error al actualizar la configuración del criterio en el periodo");
  }
};

export const deleteCriterioPeriodo = async (id) => {
  try {
    const sql = `
      DELETE FROM public.criterios_periodo_evaluacion
      WHERE id = $1
      RETURNING id;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en deleteCriterioPeriodo");
    throw new Error("No se puede eliminar el criterio del periodo porque ya existen evaluaciones registradas");
  }
};

// ==========================================
// 4. EVALUACIONES DE DESEMPEÑO
// ==========================================

export const createEvaluacion = async ({
  id_empleado,
  id_periodo,
  id_evaluador = null,
  observaciones = null,
}) => {
  try {
    const sql = `
      INSERT INTO public.evaluaciones_desempeno
        (id_empleado, id_periodo, id_evaluador, observaciones, estado)
      VALUES ($1, $2, $3, $4, 'borrador')
      RETURNING id, id_empleado, id_periodo, id_evaluador, fecha_evaluacion, estado, puntuacion_total, observaciones, fecha_cierre;
    `;
    const res = await query(sql, [
      id_empleado,
      id_periodo,
      id_evaluador,
      observaciones,
    ]);
    return res.rows[0];
  } catch (err) {
    logger.error({ err, id_empleado, id_periodo }, "Error en createEvaluacion");
    if (err.code === "23505") {
      throw new Error("El empleado ya posee una evaluación registrada para este periodo");
    }
    throw new Error("Error al crear la evaluación de desempeño");
  }
};

export const getEvaluaciones = async ({
  limit = 10,
  offset = 0,
  id_empleado = null,
  id_periodo = null,
  id_evaluador = null,
  estado = null,
}) => {
  try {
    const lim = Number(limit) || 10;
    const off = Number(offset) || 0;

    let sql = `
      SELECT
        ev.id, ev.id_empleado, ev.id_periodo, ev.id_evaluador,
        ev.fecha_evaluacion, ev.estado, ev.puntuacion_total, ev.observaciones, ev.fecha_cierre,
        e.codigo_empleado, e.cedula, e.nombres AS empleado_nombres, e.apellidos AS empleado_apellidos,
        p.nombre AS periodo_nombre,
        u.nombre AS evaluador_nombre,
        COUNT(*) OVER() AS total_count
      FROM public.evaluaciones_desempeno ev
      JOIN public.empleados e ON e.id = ev.id_empleado
      JOIN public.periodos_evaluacion p ON p.id = ev.id_periodo
      LEFT JOIN public.usuarios u ON u.id = ev.id_evaluador
    `;
    const params = [];
    const conditions = [];

    if (id_empleado) {
      params.push(id_empleado);
      conditions.push(`ev.id_empleado = $${params.length}`);
    }
    if (id_periodo) {
      params.push(id_periodo);
      conditions.push(`ev.id_periodo = $${params.length}`);
    }
    if (id_evaluador) {
      params.push(id_evaluador);
      conditions.push(`ev.id_evaluador = $${params.length}`);
    }
    if (estado) {
      params.push(estado);
      conditions.push(`ev.estado = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    params.push(lim);
    sql += ` ORDER BY ev.fecha_evaluacion DESC LIMIT $${params.length}`;

    params.push(off);
    sql += ` OFFSET $${params.length};`;

    const res = await query(sql, params);
    const total = res.rows.length > 0 ? parseInt(res.rows[0].total_count, 10) : 0;
    const data = res.rows.map(({ total_count, ...item }) => item);

    return { data, total };
  } catch (err) {
    logger.error({ err }, "Error en getEvaluaciones");
    throw new Error("Error al consultar evaluaciones de desempeño");
  }
};

export const getEvaluacionById = async (id) => {
  try {
    const sql = `
      SELECT
        ev.id, ev.id_empleado, ev.id_periodo, ev.id_evaluador,
        ev.fecha_evaluacion, ev.estado, ev.puntuacion_total, ev.observaciones, ev.fecha_cierre,
        e.codigo_empleado, e.cedula, e.nombres AS empleado_nombres, e.apellidos AS empleado_apellidos,
        p.nombre AS periodo_nombre, p.estado AS periodo_estado,
        u.nombre AS evaluador_nombre
      FROM public.evaluaciones_desempeno ev
      JOIN public.empleados e ON e.id = ev.id_empleado
      JOIN public.periodos_evaluacion p ON p.id = ev.id_periodo
      LEFT JOIN public.usuarios u ON u.id = ev.id_evaluador
      WHERE ev.id = $1;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en getEvaluacionById");
    throw new Error("Error al consultar evaluación por ID");
  }
};

export const updateEvaluacion = async (id, updateData) => {
  try {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = ["id_evaluador", "observaciones"];
    for (const field of allowed) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = $${idx}`);
        values.push(updateData[field]);
        idx++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const sql = `
      UPDATE public.evaluaciones_desempeno
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING id, id_empleado, id_periodo, id_evaluador, fecha_evaluacion, estado, puntuacion_total, observaciones, fecha_cierre;
    `;
    const res = await query(sql, values);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id, updateData }, "Error en updateEvaluacion");
    throw new Error("Error al actualizar datos de la evaluación");
  }
};

export const updateEstadoEvaluacion = async (id, estado, fecha_cierre = null) => {
  try {
    const sql = `
      UPDATE public.evaluaciones_desempeno
      SET estado = $1,
          fecha_cierre = CASE WHEN $1 IN ('aprobada', 'completada', 'cancelada') THEN COALESCE($2, NOW()) ELSE fecha_cierre END
      WHERE id = $3
      RETURNING id, estado, fecha_cierre, puntuacion_total;
    `;
    const res = await query(sql, [estado, fecha_cierre, id]);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id, estado }, "Error en updateEstadoEvaluacion");
    throw new Error("Error al actualizar estado de la evaluación");
  }
};

export const updatePuntuacionTotalEvaluacion = async (id, puntuacion_total) => {
  try {
    const sql = `
      UPDATE public.evaluaciones_desempeno
      SET puntuacion_total = $1
      WHERE id = $2
      RETURNING id, puntuacion_total;
    `;
    const res = await query(sql, [puntuacion_total, id]);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id, puntuacion_total }, "Error en updatePuntuacionTotalEvaluacion");
    throw new Error("Error al actualizar puntuación total de la evaluación");
  }
};

// ==========================================
// 5. RESULTADOS DE LA CHECKLIST
// ==========================================

export const getResultadosByEvaluacionId = async (id_evaluacion) => {
  try {
    const sql = `
      SELECT
        re.id, re.id_evaluacion, re.id_criterio_periodo, re.puntuacion, re.comentario, re.cumplido,
        cp.ponderacion, cp.puntuacion_maxima, cp.orden,
        c.id AS id_criterio, c.nombre AS criterio_nombre, c.descripcion AS criterio_descripcion
      FROM public.resultados_evaluacion re
      JOIN public.criterios_periodo_evaluacion cp ON cp.id = re.id_criterio_periodo
      JOIN public.criterios_evaluacion c ON c.id = cp.id_criterio
      WHERE re.id_evaluacion = $1
      ORDER BY cp.orden ASC, c.nombre ASC;
    `;
    const res = await query(sql, [id_evaluacion]);
    return res.rows;
  } catch (err) {
    logger.error({ err, id_evaluacion }, "Error en getResultadosByEvaluacionId");
    throw new Error("Error al obtener los resultados de la checklist");
  }
};

export const upsertResultadoWithClient = async (
  client,
  { id_evaluacion, id_criterio_periodo, puntuacion, comentario = null, cumplido = null }
) => {
  const sql = `
    INSERT INTO public.resultados_evaluacion (id_evaluacion, id_criterio_periodo, puntuacion, comentario, cumplido)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id_evaluacion, id_criterio_periodo)
    DO UPDATE SET
      puntuacion = EXCLUDED.puntuacion,
      comentario = EXCLUDED.comentario,
      cumplido = EXCLUDED.cumplido
    RETURNING id, id_evaluacion, id_criterio_periodo, puntuacion, comentario, cumplido;
  `;
  const res = await client.query(sql, [
    id_evaluacion,
    id_criterio_periodo,
    puntuacion,
    comentario,
    cumplido,
  ]);
  return res.rows[0];
};

export const calculateWeightedScore = async (id_evaluacion) => {
  try {
    const sql = `
      SELECT
        COALESCE(
          SUM(
            (re.puntuacion / cp.puntuacion_maxima) * cp.ponderacion
          ), 0
        ) AS total_calculado
      FROM public.resultados_evaluacion re
      JOIN public.criterios_periodo_evaluacion cp ON cp.id = re.id_criterio_periodo
      WHERE re.id_evaluacion = $1;
    `;
    const res = await query(sql, [id_evaluacion]);
    return parseFloat(res.rows[0].total_calculado);
  } catch (err) {
    logger.error({ err, id_evaluacion }, "Error en calculateWeightedScore");
    throw new Error("Error al calcular la puntuación total ponderada");
  }
};

// ==========================================
// 6. OBJETIVOS DE EMPLEADO
// ==========================================

export const createObjetivo = async ({
  id_empleado,
  id_periodo,
  titulo,
  descripcion = null,
  meta = null,
  resultado = null,
  porcentaje_cumplimiento = null,
  estado = "pendiente",
}) => {
  try {
    const sql = `
      INSERT INTO public.objetivos_empleado
        (id_empleado, id_periodo, titulo, descripcion, meta, resultado, porcentaje_cumplimiento, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, id_empleado, id_periodo, titulo, descripcion, meta, resultado, porcentaje_cumplimiento, estado, fecha_creacion;
    `;
    const res = await query(sql, [
      id_empleado,
      id_periodo,
      titulo,
      descripcion,
      meta,
      resultado,
      porcentaje_cumplimiento,
      estado,
    ]);
    return res.rows[0];
  } catch (err) {
    logger.error({ err, id_empleado, id_periodo }, "Error en createObjetivo");
    throw new Error("Error al registrar objetivo del empleado");
  }
};

export const getObjetivos = async ({
  id_empleado = null,
  id_periodo = null,
  estado = null,
} = {}) => {
  try {
    let sql = `
      SELECT
        obj.id, obj.id_empleado, obj.id_periodo, obj.titulo, obj.descripcion,
        obj.meta, obj.resultado, obj.porcentaje_cumplimiento, obj.estado, obj.fecha_creacion,
        e.nombres AS empleado_nombres, e.apellidos AS empleado_apellidos,
        p.nombre AS periodo_nombre
      FROM public.objetivos_empleado obj
      JOIN public.empleados e ON e.id = obj.id_empleado
      JOIN public.periodos_evaluacion p ON p.id = obj.id_periodo
    `;
    const params = [];
    const conditions = [];

    if (id_empleado) {
      params.push(id_empleado);
      conditions.push(`obj.id_empleado = $${params.length}`);
    }
    if (id_periodo) {
      params.push(id_periodo);
      conditions.push(`obj.id_periodo = $${params.length}`);
    }
    if (estado) {
      params.push(estado);
      conditions.push(`obj.estado = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql += ` ORDER BY obj.fecha_creacion DESC;`;

    const res = await query(sql, params);
    return res.rows;
  } catch (err) {
    logger.error({ err }, "Error en getObjetivos");
    throw new Error("Error al consultar objetivos de empleados");
  }
};

export const getObjetivoById = async (id) => {
  try {
    const sql = `
      SELECT
        obj.id, obj.id_empleado, obj.id_periodo, obj.titulo, obj.descripcion,
        obj.meta, obj.resultado, obj.porcentaje_cumplimiento, obj.estado, obj.fecha_creacion,
        e.nombres AS empleado_nombres, e.apellidos AS empleado_apellidos,
        p.nombre AS periodo_nombre
      FROM public.objetivos_empleado obj
      JOIN public.empleados e ON e.id = obj.id_empleado
      JOIN public.periodos_evaluacion p ON p.id = obj.id_periodo
      WHERE obj.id = $1;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en getObjetivoById");
    throw new Error("Error al consultar objetivo por ID");
  }
};

export const updateObjetivo = async (id, updateData) => {
  try {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = [
      "titulo",
      "descripcion",
      "meta",
      "resultado",
      "porcentaje_cumplimiento",
      "estado",
    ];
    for (const field of allowed) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = $${idx}`);
        values.push(updateData[field]);
        idx++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const sql = `
      UPDATE public.objetivos_empleado
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING id, id_empleado, id_periodo, titulo, descripcion, meta, resultado, porcentaje_cumplimiento, estado, fecha_creacion;
    `;
    const res = await query(sql, values);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id, updateData }, "Error en updateObjetivo");
    throw new Error("Error al actualizar el objetivo");
  }
};

export const deleteObjetivo = async (id) => {
  try {
    const sql = `
      DELETE FROM public.objetivos_empleado
      WHERE id = $1
      RETURNING id;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en deleteObjetivo");
    throw new Error("Error al eliminar el objetivo");
  }
};
