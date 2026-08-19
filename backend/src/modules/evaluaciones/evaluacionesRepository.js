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
        ev.fecha_evaluacion, ev.estado, ev.puntuacion_total, 
        ev.observaciones, ev.fortalezas, ev.areas_oportunidad, ev.comentarios_empleado, ev.fecha_cierre,
        e.codigo_empleado, e.cedula, e.nombres AS empleado_nombres, e.apellidos AS empleado_apellidos,
        c.nombre AS cargo_nombre,
        CONCAT(sup.nombres, ' ', sup.apellidos) AS supervisor_nombre,
        p.nombre AS periodo_nombre,
        u.correo AS evaluador_nombre,
        COUNT(*) OVER() AS total_count
      FROM public.evaluaciones_desempeno ev
      JOIN public.empleados e ON e.id = ev.id_empleado
      LEFT JOIN public.cargos c ON c.id = e.id_cargo
      LEFT JOIN public.empleados sup ON sup.id = e.id_supervisor
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
        ev.fecha_evaluacion, ev.estado, ev.puntuacion_total, 
        ev.observaciones, ev.fortalezas, ev.areas_oportunidad, ev.comentarios_empleado, ev.fecha_cierre,
        e.codigo_empleado, e.cedula, e.nombres AS empleado_nombres, e.apellidos AS empleado_apellidos,
        e.fecha_contratacion AS empleado_fecha_contratacion,
        c.nombre AS cargo_nombre,
        CONCAT(sup.nombres, ' ', sup.apellidos) AS supervisor_nombre,
        p.nombre AS periodo_nombre, p.fecha_inicio AS periodo_fecha_inicio, p.fecha_fin AS periodo_fecha_fin, p.estado AS periodo_estado,
        u.correo AS evaluador_nombre,
        r.nombre AS evaluador_rol
      FROM public.evaluaciones_desempeno ev
      JOIN public.empleados e ON e.id = ev.id_empleado
      LEFT JOIN public.cargos c ON c.id = e.id_cargo
      LEFT JOIN public.empleados sup ON sup.id = e.id_supervisor
      JOIN public.periodos_evaluacion p ON p.id = ev.id_periodo
      LEFT JOIN public.usuarios u ON u.id = ev.id_evaluador
      LEFT JOIN public.roles r ON r.id = u.id_rol
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

    const allowed = [
      "id_evaluador",
      "observaciones",
      "fortalezas",
      "areas_oportunidad",
      "comentarios_empleado",
      "modificado_por",
    ];
    for (const field of allowed) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = $${idx}`);
        values.push(updateData[field]);
        idx++;
      }
    }

    if (fields.length === 0) return null;

    fields.push(`fecha_modificacion = NOW()`);
    values.push(id);
    const sql = `
      UPDATE public.evaluaciones_desempeno
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING id, id_empleado, id_periodo, id_evaluador, fecha_evaluacion, estado, puntuacion_total, observaciones, fortalezas, areas_oportunidad, comentarios_empleado, fecha_cierre;
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

// ==========================================
// 7. PREGUNTAS DE EVALUACIÓN (CHECKLIST)
// ==========================================

export const getPreguntas = async ({ id_criterio = null, activo = null } = {}) => {
  try {
    let sql = `
      SELECT
        p.id, p.id_criterio, p.texto, p.tipo_respuesta, p.puntuacion_maxima, p.orden, p.activo, p.fecha_creacion,
        c.nombre AS criterio_nombre
      FROM public.preguntas_evaluacion p
      JOIN public.criterios_evaluacion c ON c.id = p.id_criterio
    `;
    const params = [];
    const conds = [];

    if (id_criterio) {
      params.push(id_criterio);
      conds.push(`p.id_criterio = $${params.length}`);
    }
    if (activo !== null) {
      params.push(activo);
      conds.push(`p.activo = $${params.length}`);
    }

    if (conds.length > 0) {
      sql += ` WHERE ${conds.join(" AND ")}`;
    }

    sql += ` ORDER BY c.orden ASC, p.orden ASC;`;
    const res = await query(sql, params);
    return res.rows;
  } catch (err) {
    logger.error({ err }, "Error en getPreguntas");
    throw new Error("Error al obtener preguntas del checklist");
  }
};

export const getPreguntaById = async (id) => {
  try {
    const sql = `
      SELECT p.*, c.nombre AS criterio_nombre
      FROM public.preguntas_evaluacion p
      JOIN public.criterios_evaluacion c ON c.id = p.id_criterio
      WHERE p.id = $1;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en getPreguntaById");
    throw new Error("Error al consultar pregunta");
  }
};

export const createPregunta = async ({ id_criterio, texto, tipo_respuesta = "escala_1_5", puntuacion_maxima = 5, orden = 1, activo = true }) => {
  try {
    const sql = `
      INSERT INTO public.preguntas_evaluacion (id_criterio, texto, tipo_respuesta, puntuacion_maxima, orden, activo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const res = await query(sql, [id_criterio, texto, tipo_respuesta, puntuacion_maxima, orden, activo]);
    return res.rows[0];
  } catch (err) {
    logger.error({ err }, "Error en createPregunta");
    throw new Error("Error al crear la pregunta");
  }
};

export const updatePregunta = async (id, updateData) => {
  try {
    const fields = [];
    const values = [];
    let idx = 1;
    const allowed = ["id_criterio", "texto", "tipo_respuesta", "puntuacion_maxima", "orden", "activo"];
    for (const field of allowed) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = $${idx}`);
        values.push(updateData[field]);
        idx++;
      }
    }
    if (fields.length === 0) return null;
    values.push(id);
    const sql = `UPDATE public.preguntas_evaluacion SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *;`;
    const res = await query(sql, values);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en updatePregunta");
    throw new Error("Error al actualizar la pregunta");
  }
};

export const deletePregunta = async (id) => {
  try {
    const sql = `DELETE FROM public.preguntas_evaluacion WHERE id = $1 RETURNING id;`;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en deletePregunta");
    throw new Error("Error al eliminar la pregunta");
  }
};

// ==========================================
// 8. RESPUESTAS DETALLADAS A PREGUNTAS
// ==========================================

export const getRespuestasByEvaluacionId = async (id_evaluacion) => {
  try {
    const sql = `
      SELECT
        re.id, re.id_evaluacion, re.id_pregunta, re.id_criterio_periodo, re.puntuacion, re.comentario,
        p.texto AS pregunta_texto, p.orden AS pregunta_orden,
        c.nombre AS criterio_nombre, c.id AS id_criterio
      FROM public.respuestas_evaluacion re
      JOIN public.preguntas_evaluacion p ON p.id = re.id_pregunta
      JOIN public.criterios_evaluacion c ON c.id = p.id_criterio
      WHERE re.id_evaluacion = $1
      ORDER BY c.orden ASC, p.orden ASC;
    `;
    const res = await query(sql, [id_evaluacion]);
    return res.rows;
  } catch (err) {
    logger.error({ err, id_evaluacion }, "Error en getRespuestasByEvaluacionId");
    throw new Error("Error al consultar respuestas detalladas");
  }
};

export const upsertRespuestaWithClient = async (
  client,
  { id_evaluacion, id_pregunta, id_criterio_periodo, puntuacion, comentario = null }
) => {
  const sql = `
    INSERT INTO public.respuestas_evaluacion (id_evaluacion, id_pregunta, id_criterio_periodo, puntuacion, comentario)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id_evaluacion, id_pregunta)
    DO UPDATE SET
      puntuacion = EXCLUDED.puntuacion,
      comentario = EXCLUDED.comentario,
      id_criterio_periodo = EXCLUDED.id_criterio_periodo
    RETURNING id, id_evaluacion, id_pregunta, puntuacion, comentario;
  `;
  const res = await client.query(sql, [
    id_evaluacion,
    id_pregunta,
    id_criterio_periodo,
    puntuacion,
    comentario,
  ]);
  return res.rows[0];
};

// ==========================================
// 9. PLANES DE MEJORA CONTINUA
// ==========================================

export const createPlanMejora = async ({
  id_evaluacion = null,
  id_empleado,
  id_criterio = null,
  problema_detectado,
  objetivo_mejora,
  acciones_propuestas,
  responsable = null,
  fecha_inicio = null,
  fecha_limite = null,
  porcentaje_avance = 0,
  estado = "pendiente",
  observaciones = null,
}) => {
  try {
    const sql = `
      INSERT INTO public.planes_mejora (
        id_evaluacion, id_empleado, id_criterio, problema_detectado, objetivo_mejora,
        acciones_propuestas, responsable, fecha_inicio, fecha_limite, porcentaje_avance, estado, observaciones
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const res = await query(sql, [
      id_evaluacion,
      id_empleado,
      id_criterio,
      problema_detectado,
      objetivo_mejora,
      acciones_propuestas,
      responsable,
      fecha_inicio,
      fecha_limite,
      porcentaje_avance,
      estado,
      observaciones,
    ]);
    return res.rows[0];
  } catch (err) {
    logger.error({ err }, "Error en createPlanMejora");
    throw new Error("Error al crear el plan de mejora");
  }
};

export const getPlanesMejora = async ({ id_empleado = null, id_evaluacion = null, estado = null } = {}) => {
  try {
    let sql = `
      SELECT
        pm.*,
        e.nombres AS empleado_nombres, e.apellidos AS empleado_apellidos, e.codigo_empleado,
        c.nombre AS criterio_nombre
      FROM public.planes_mejora pm
      JOIN public.empleados e ON e.id = pm.id_empleado
      LEFT JOIN public.criterios_evaluacion c ON c.id = pm.id_criterio
    `;
    const params = [];
    const conds = [];

    if (id_empleado) {
      params.push(id_empleado);
      conds.push(`pm.id_empleado = $${params.length}`);
    }
    if (id_evaluacion) {
      params.push(id_evaluacion);
      conds.push(`pm.id_evaluacion = $${params.length}`);
    }
    if (estado) {
      params.push(estado);
      conds.push(`pm.estado = $${params.length}`);
    }

    if (conds.length > 0) {
      sql += ` WHERE ${conds.join(" AND ")}`;
    }

    sql += ` ORDER BY pm.fecha_creacion DESC;`;
    const res = await query(sql, params);
    return res.rows;
  } catch (err) {
    logger.error({ err }, "Error en getPlanesMejora");
    throw new Error("Error al consultar planes de mejora");
  }
};

export const getPlanMejoraById = async (id) => {
  try {
    const sql = `
      SELECT pm.*, e.nombres AS empleado_nombres, e.apellidos AS empleado_apellidos, c.nombre AS criterio_nombre
      FROM public.planes_mejora pm
      JOIN public.empleados e ON e.id = pm.id_empleado
      LEFT JOIN public.criterios_evaluacion c ON c.id = pm.id_criterio
      WHERE pm.id = $1;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en getPlanMejoraById");
    throw new Error("Error al consultar plan de mejora por ID");
  }
};

export const updatePlanMejora = async (id, updateData) => {
  try {
    const fields = [];
    const values = [];
    let idx = 1;
    const allowed = [
      "problema_detectado",
      "objetivo_mejora",
      "acciones_propuestas",
      "responsable",
      "fecha_inicio",
      "fecha_limite",
      "porcentaje_avance",
      "estado",
      "observaciones",
      "resultado_final",
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
    const sql = `UPDATE public.planes_mejora SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *;`;
    const res = await query(sql, values);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en updatePlanMejora");
    throw new Error("Error al actualizar el plan de mejora");
  }
};

export const deletePlanMejora = async (id) => {
  try {
    const sql = `DELETE FROM public.planes_mejora WHERE id = $1 RETURNING id;`;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en deletePlanMejora");
    throw new Error("Error al eliminar el plan de mejora");
  }
};

// ==========================================
// 10. METRICAS Y DASHBOARD DE EVALUACIÓN
// ==========================================

export const getDashboardStats = async (id_periodo = null) => {
  try {
    const params = [];
    let periodWhere = "";
    if (id_periodo) {
      params.push(id_periodo);
      periodWhere = ` WHERE ev.id_periodo = $1`;
    }

    const sqlTotals = `
      SELECT
        (SELECT COUNT(*) FROM public.empleados WHERE estado = 'activo') AS total_empleados,
        COUNT(DISTINCT ev.id_empleado) AS empleados_evaluados,
        COUNT(ev.id) AS total_evaluaciones,
        COUNT(CASE WHEN ev.estado = 'borrador' THEN 1 END) AS evaluaciones_borrador,
        COUNT(CASE WHEN ev.estado = 'en_proceso' THEN 1 END) AS evaluaciones_en_proceso,
        COUNT(CASE WHEN ev.estado = 'completada' THEN 1 END) AS evaluaciones_completadas,
        COUNT(CASE WHEN ev.estado = 'aprobada' THEN 1 END) AS evaluaciones_aprobadas,
        COALESCE(ROUND(AVG(ev.puntuacion_total), 2), 0) AS promedio_general_nota,
        COUNT(CASE WHEN ev.puntuacion_total < 70 AND ev.estado IN ('completada', 'aprobada') THEN 1 END) AS bajo_desempeno_count
      FROM public.evaluaciones_desempeno ev
      ${periodWhere};
    `;
    const totalsRes = await query(sqlTotals, params);

    const sqlPlanes = `SELECT COUNT(*) AS active_plans FROM public.planes_mejora WHERE estado IN ('pendiente', 'en_progreso');`;
    const planesRes = await query(sqlPlanes);

    const sqlPorCargo = `
      SELECT
        COALESCE(c.nombre, 'Sin Cargo') AS cargo_nombre,
        COUNT(ev.id) AS total_evaluaciones,
        COALESCE(ROUND(AVG(ev.puntuacion_total), 2), 0) AS promedio_nota
      FROM public.evaluaciones_desempeno ev
      JOIN public.empleados e ON e.id = ev.id_empleado
      LEFT JOIN public.cargos c ON c.id = e.id_cargo
      ${periodWhere}
      GROUP BY c.nombre;
    `;
    const porCargoRes = await query(sqlPorCargo, params);

    return {
      totals: totalsRes.rows[0],
      planes_activos: parseInt(planesRes.rows[0].active_plans, 10),
      por_cargo: porCargoRes.rows,
    };
  } catch (err) {
    logger.error({ err, id_periodo }, "Error en getDashboardStats");
    throw new Error("Error al obtener estadísticas del dashboard");
  }
};
