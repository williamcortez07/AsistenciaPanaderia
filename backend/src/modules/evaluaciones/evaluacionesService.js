import * as repo from "./evaluacionesRepository.js";
import { getClient } from "../../config/db.js";

// ==========================================
// 1. PERIODOS DE EVALUACIÓN
// ==========================================

export const createPeriodoService = async (periodoData) => {
  return await repo.createPeriodo(periodoData);
};

export const getPeriodosService = async (queryParams) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 10;
  const offset = (page - 1) * limit;

  const { data, total } = await repo.getPeriodos({
    limit,
    offset,
    estado: queryParams.estado || null,
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

export const getPeriodoByIdService = async (id) => {
  const periodo = await repo.getPeriodoById(id);
  if (!periodo) {
    const err = new Error("Periodo de evaluación no encontrado");
    err.statusCode = 404;
    throw err;
  }

  const criterios = await repo.getCriteriosByPeriodoId(id);
  const total_ponderacion = await repo.getSumPonderacionByPeriodo(id);

  return {
    ...periodo,
    total_ponderacion,
    criterios_configurados: criterios,
  };
};

export const updatePeriodoService = async (id, updateData) => {
  const existing = await repo.getPeriodoById(id);
  if (!existing) {
    const err = new Error("Periodo de evaluación no encontrado");
    err.statusCode = 404;
    throw err;
  }

  return await repo.updatePeriodo(id, updateData);
};

export const updateEstadoPeriodoService = async (id, estado) => {
  const existing = await repo.getPeriodoById(id);
  if (!existing) {
    const err = new Error("Periodo de evaluación no encontrado");
    err.statusCode = 404;
    throw err;
  }

  return await repo.updateEstadoPeriodo(id, estado);
};

// ==========================================
// 2. CRITERIOS DE EVALUACIÓN (CATÁLOGO)
// ==========================================

export const createCriterioService = async (criterioData) => {
  return await repo.createCriterio(criterioData);
};

export const getCriteriosService = async (queryParams) => {
  const activo = queryParams.activo !== undefined ? queryParams.activo : null;
  return await repo.getCriterios({ activo });
};

export const getCriterioByIdService = async (id) => {
  const criterio = await repo.getCriterioById(id);
  if (!criterio) {
    const err = new Error("Criterio de evaluación no encontrado");
    err.statusCode = 404;
    throw err;
  }
  return criterio;
};

export const updateCriterioService = async (id, updateData) => {
  const existing = await repo.getCriterioById(id);
  if (!existing) {
    const err = new Error("Criterio de evaluación no encontrado");
    err.statusCode = 404;
    throw err;
  }

  return await repo.updateCriterio(id, updateData);
};

export const deleteCriterioService = async (id) => {
  const existing = await repo.getCriterioById(id);
  if (!existing) {
    const err = new Error("Criterio de evaluación no encontrado");
    err.statusCode = 404;
    throw err;
  }

  return await repo.deleteCriterio(id);
};

// ==========================================
// 3. CRITERIOS POR PERIODO
// ==========================================

export const addCriterioPeriodoService = async (data) => {
  const periodo = await repo.getPeriodoById(data.id_periodo);
  if (!periodo) {
    const err = new Error("El periodo especificado no existe");
    err.statusCode = 404;
    throw err;
  }

  const criterio = await repo.getCriterioById(data.id_criterio);
  if (!criterio) {
    const err = new Error("El criterio especificado no existe");
    err.statusCode = 404;
    throw err;
  }

  const result = await repo.addCriterioPeriodo(data);
  const sumPonderacion = await repo.getSumPonderacionByPeriodo(data.id_periodo);

  return {
    ...result,
    total_ponderacion_periodo: sumPonderacion,
    advertencia_ponderacion:
      sumPonderacion !== 100
        ? `Atención: La suma total de ponderaciones del periodo actualmente es ${sumPonderacion}%. Se recomienda que sume 100%.`
        : null,
  };
};

export const getCriteriosByPeriodoIdService = async (id_periodo) => {
  const periodo = await repo.getPeriodoById(id_periodo);
  if (!periodo) {
    const err = new Error("Periodo de evaluación no encontrado");
    err.statusCode = 404;
    throw err;
  }

  const criterios = await repo.getCriteriosByPeriodoId(id_periodo);
  const total_ponderacion = await repo.getSumPonderacionByPeriodo(id_periodo);

  return {
    id_periodo,
    total_ponderacion,
    criterios,
  };
};

export const updateCriterioPeriodoService = async (id, updateData) => {
  const updated = await repo.updateCriterioPeriodo(id, updateData);
  if (!updated) {
    const err = new Error("Configuración de criterio por periodo no encontrada");
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

export const deleteCriterioPeriodoService = async (id) => {
  const deleted = await repo.deleteCriterioPeriodo(id);
  if (!deleted) {
    const err = new Error("Configuración de criterio por periodo no encontrada");
    err.statusCode = 404;
    throw err;
  }
  return deleted;
};

// ==========================================
// 4. EVALUACIONES DE DESEMPEÑO
// ==========================================

export const createEvaluacionService = async (evaluacionData) => {
  const periodo = await repo.getPeriodoById(evaluacionData.id_periodo);
  if (!periodo) {
    const err = new Error("Periodo de evaluación no encontrado");
    err.statusCode = 404;
    throw err;
  }

  if (periodo.estado !== "abierto") {
    const err = new Error("No se pueden crear evaluaciones en un periodo cerrado o cancelado");
    err.statusCode = 400;
    throw err;
  }

  return await repo.createEvaluacion(evaluacionData);
};

export const getEvaluacionesService = async (queryParams) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 10;
  const offset = (page - 1) * limit;

  const { data, total } = await repo.getEvaluaciones({
    limit,
    offset,
    id_empleado: queryParams.id_empleado || null,
    id_periodo: queryParams.id_periodo || null,
    id_evaluador: queryParams.id_evaluador || null,
    estado: queryParams.estado || null,
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

export const getEvaluacionByIdService = async (id) => {
  const evaluacion = await repo.getEvaluacionById(id);
  if (!evaluacion) {
    const err = new Error("Evaluación de desempeño no encontrada");
    err.statusCode = 404;
    throw err;
  }

  const resultados = await repo.getResultadosByEvaluacionId(id);
  const objetivos = await repo.getObjetivos({
    id_empleado: evaluacion.id_empleado,
    id_periodo: evaluacion.id_periodo,
  });

  return {
    ...evaluacion,
    resultados_checklist: resultados,
    objetivos_empleado: objetivos,
  };
};

export const updateEvaluacionService = async (id, updateData) => {
  const existing = await repo.getEvaluacionById(id);
  if (!existing) {
    const err = new Error("Evaluación de desempeño no encontrada");
    err.statusCode = 404;
    throw err;
  }

  if (existing.estado === "aprobada" || existing.estado === "cancelada") {
    const err = new Error(`No se puede modificar una evaluación con estado '${existing.estado}'`);
    err.statusCode = 400;
    throw err;
  }

  return await repo.updateEvaluacion(id, updateData);
};

export const updateEstadoEvaluacionService = async (id, estado) => {
  const existing = await repo.getEvaluacionById(id);
  if (!existing) {
    const err = new Error("Evaluación de desempeño no encontrada");
    err.statusCode = 404;
    throw err;
  }

  let fecha_cierre = null;
  if (estado === "aprobada" || estado === "completada" || estado === "cancelada") {
    fecha_cierre = new Date();
  }

  return await repo.updateEstadoEvaluacion(id, estado, fecha_cierre);
};

export const calcularEvaluacionService = async (id) => {
  const existing = await repo.getEvaluacionById(id);
  if (!existing) {
    const err = new Error("Evaluación de desempeño no encontrada");
    err.statusCode = 404;
    throw err;
  }

  const puntuacion_total = await repo.calculateWeightedScore(id);
  const updated = await repo.updatePuntuacionTotalEvaluacion(id, puntuacion_total);

  return {
    ...updated,
    puntuacion_total,
  };
};

// ==========================================
// 5. RESULTADOS CHECKLIST BULK
// ==========================================

export const saveResultadosBulkService = async (id_evaluacion, resultados) => {
  const evaluacion = await repo.getEvaluacionById(id_evaluacion);
  if (!evaluacion) {
    const err = new Error("Evaluación de desempeño no encontrada");
    err.statusCode = 404;
    throw err;
  }

  if (evaluacion.estado === "aprobada" || evaluacion.estado === "cancelada") {
    const err = new Error(`No se pueden calificar evaluaciones en estado '${evaluacion.estado}'`);
    err.statusCode = 400;
    throw err;
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");

    const savedResultados = [];
    for (const item of resultados) {
      const res = await repo.upsertResultadoWithClient(client, {
        id_evaluacion,
        id_criterio_periodo: item.id_criterio_periodo,
        puntuacion: item.puntuacion,
        comentario: item.comentario || null,
        cumplido: item.cumplido !== undefined ? item.cumplido : null,
      });
      savedResultados.push(res);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  // Recalcular puntuación ponderada total tras guardar resultados
  const puntuacion_total = await repo.calculateWeightedScore(id_evaluacion);
  await repo.updatePuntuacionTotalEvaluacion(id_evaluacion, puntuacion_total);

  return {
    id_evaluacion,
    puntuacion_total,
    total_rubros_guardados: resultados.length,
  };
};

// ==========================================
// 6. OBJETIVOS DE EMPLEADO
// ==========================================

export const createObjetivoService = async (objetivoData) => {
  const periodo = await repo.getPeriodoById(objetivoData.id_periodo);
  if (!periodo) {
    const err = new Error("Periodo de evaluación no encontrado");
    err.statusCode = 404;
    throw err;
  }

  // Calcular % de cumplimiento si meta y resultado están presentes
  if (
    objetivoData.meta &&
    objetivoData.meta > 0 &&
    objetivoData.resultado !== undefined &&
    objetivoData.resultado !== null &&
    objetivoData.porcentaje_cumplimiento === undefined
  ) {
    const pct = (objetivoData.resultado / objetivoData.meta) * 100;
    objetivoData.porcentaje_cumplimiento = Math.min(Math.max(pct, 0), 100);
  }

  return await repo.createObjetivo(objetivoData);
};

export const getObjetivosService = async (queryParams) => {
  return await repo.getObjetivos({
    id_empleado: queryParams.id_empleado || null,
    id_periodo: queryParams.id_periodo || null,
    estado: queryParams.estado || null,
  });
};

export const getObjetivoByIdService = async (id) => {
  const objetivo = await repo.getObjetivoById(id);
  if (!objetivo) {
    const err = new Error("Objetivo no encontrado");
    err.statusCode = 404;
    throw err;
  }
  return objetivo;
};

export const updateObjetivoService = async (id, updateData) => {
  const existing = await repo.getObjetivoById(id);
  if (!existing) {
    const err = new Error("Objetivo no encontrado");
    err.statusCode = 404;
    throw err;
  }

  const meta = updateData.meta !== undefined ? updateData.meta : existing.meta;
  const resultado = updateData.resultado !== undefined ? updateData.resultado : existing.resultado;

  if (
    meta &&
    meta > 0 &&
    resultado !== undefined &&
    resultado !== null &&
    updateData.porcentaje_cumplimiento === undefined
  ) {
    const pct = (resultado / meta) * 100;
    updateData.porcentaje_cumplimiento = Math.min(Math.max(pct, 0), 100);
  }

  return await repo.updateObjetivo(id, updateData);
};

export const deleteObjetivoService = async (id) => {
  const existing = await repo.getObjetivoById(id);
  if (!existing) {
    const err = new Error("Objetivo no encontrado");
    err.statusCode = 404;
    throw err;
  }

  return await repo.deleteObjetivo(id);
};

// ==========================================
// 7. PREGUNTAS DEL CHECKLIST
// ==========================================

export const getPreguntasService = async (queryParams = {}) => {
  const activo = queryParams.activo !== undefined ? queryParams.activo === "true" : null;
  return await repo.getPreguntas({
    id_criterio: queryParams.id_criterio || null,
    activo,
  });
};

export const getPreguntaByIdService = async (id) => {
  const pregunta = await repo.getPreguntaById(id);
  if (!pregunta) {
    const err = new Error("Pregunta de evaluación no encontrada");
    err.statusCode = 404;
    throw err;
  }
  return pregunta;
};

export const createPreguntaService = async (preguntaData) => {
  const criterio = await repo.getCriterioById(preguntaData.id_criterio);
  if (!criterio) {
    const err = new Error("El criterio especificado no existe");
    err.statusCode = 404;
    throw err;
  }
  return await repo.createPregunta(preguntaData);
};

export const updatePreguntaService = async (id, updateData) => {
  const existing = await repo.getPreguntaById(id);
  if (!existing) {
    const err = new Error("Pregunta de evaluación no encontrada");
    err.statusCode = 404;
    throw err;
  }
  return await repo.updatePregunta(id, updateData);
};

export const deletePreguntaService = async (id) => {
  const existing = await repo.getPreguntaById(id);
  if (!existing) {
    const err = new Error("Pregunta de evaluación no encontrada");
    err.statusCode = 404;
    throw err;
  }
  return await repo.deletePregunta(id);
};

// ==========================================
// 8. RESPUESTAS POR PREGUNTA (CHECKLIST DETALLADO)
// ==========================================

export const getRespuestasByEvaluacionIdService = async (id_evaluacion) => {
  const evaluacion = await repo.getEvaluacionById(id_evaluacion);
  if (!evaluacion) {
    const err = new Error("Evaluación de desempeño no encontrada");
    err.statusCode = 404;
    throw err;
  }
  return await repo.getRespuestasByEvaluacionId(id_evaluacion);
};

export const saveRespuestasItemizedBulkService = async (
  id_evaluacion,
  { respuestas = [], observaciones = null, fortalezas = null, areas_oportunidad = null, comentarios_empleado = null, userId = null }
) => {
  const evaluacion = await repo.getEvaluacionById(id_evaluacion);
  if (!evaluacion) {
    const err = new Error("Evaluación de desempeño no encontrada");
    err.statusCode = 404;
    throw err;
  }

  if (evaluacion.estado === "aprobada" || evaluacion.estado === "cancelada") {
    const err = new Error(`No se pueden calificar evaluaciones en estado '${evaluacion.estado}'`);
    err.statusCode = 400;
    throw err;
  }

  // Verificar que los criterios del periodo sumen 100%
  const criteriosPeriodo = await repo.getCriteriosByPeriodoId(evaluacion.id_periodo);
  const totalPonderacion = await repo.getSumPonderacionByPeriodo(evaluacion.id_periodo);

  if (criteriosPeriodo.length === 0) {
    const err = new Error("El periodo no tiene criterios ni ponderaciones configuradas");
    err.statusCode = 400;
    throw err;
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");

    // Map id_pregunta -> id_criterio y su id_criterio_periodo
    const preguntasList = await repo.getPreguntas();
    const preguntasMap = new Map();
    preguntasList.forEach((p) => preguntasMap.set(p.id, p));

    const critPeriodoMap = new Map();
    criteriosPeriodo.forEach((cp) => critPeriodoMap.set(cp.id_criterio, cp));

    // Guardar cada respuesta individual
    const scoresPerCriterion = new Map(); // id_criterio_periodo -> array de puntuaciones (1-5)

    for (const r of respuestas) {
      const preg = preguntasMap.get(r.id_pregunta);
      if (!preg) continue;

      const cp = critPeriodoMap.get(preg.id_criterio);
      const id_cp = cp ? cp.id : null;

      await repo.upsertRespuestaWithClient(client, {
        id_evaluacion,
        id_pregunta: r.id_pregunta,
        id_criterio_periodo: id_cp,
        puntuacion: r.puntuacion,
        comentario: r.comentario || null,
      });

      if (id_cp) {
        if (!scoresPerCriterion.has(id_cp)) {
          scoresPerCriterion.set(id_cp, []);
        }
        scoresPerCriterion.get(id_cp).push(r.puntuacion);
      }
    }

    // Calcular el promedio por criterio y guardarlo en resultados_evaluacion
    let totalPuntuacionWeighted = 0;

    for (const cp of criteriosPeriodo) {
      const scores = scoresPerCriterion.get(cp.id) || [];
      let scorePromedio0to100 = 0;

      if (scores.length > 0) {
        const sum1to5 = scores.reduce((a, b) => a + b, 0);
        const avg1to5 = sum1to5 / scores.length;
        scorePromedio0to100 = (avg1to5 / 5) * 100;
      }

      await repo.upsertResultadoWithClient(client, {
        id_evaluacion,
        id_criterio_periodo: cp.id,
        puntuacion: scorePromedio0to100,
        comentario: `Promedio de ${scores.length} preguntas respondidas`,
        cumplido: scorePromedio0to100 >= 70,
      });

      const weightedContribution = (scorePromedio0to100 / 100) * cp.ponderacion;
      totalPuntuacionWeighted += weightedContribution;
    }

    // Redondear puntuacion final a 2 decimales
    totalPuntuacionWeighted = Math.round(totalPuntuacionWeighted * 100) / 100;

    // Actualizar la evaluación
    await repo.updateEvaluacion(id_evaluacion, {
      observaciones,
      fortalezas,
      areas_oportunidad,
      comentarios_empleado,
      modificado_por: userId,
    });

    await repo.updatePuntuacionTotalEvaluacion(id_evaluacion, totalPuntuacionWeighted);
    await repo.updateEstadoEvaluacion(id_evaluacion, "completada", new Date());

    await client.query("COMMIT");

    return {
      id_evaluacion,
      puntuacion_total: totalPuntuacionWeighted,
      estado: "completada",
      total_respuestas_guardadas: respuestas.length,
      total_ponderacion_periodo: totalPonderacion,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ==========================================
// 9. PLANES DE MEJORA CONTINUA
// ==========================================

export const createPlanMejoraService = async (planData) => {
  const empleado = await repo.getEvaluacionById(planData.id_empleado);
  return await repo.createPlanMejora(planData);
};

export const getPlanesMejoraService = async (queryParams = {}) => {
  return await repo.getPlanesMejora({
    id_empleado: queryParams.id_empleado || null,
    id_evaluacion: queryParams.id_evaluacion || null,
    estado: queryParams.estado || null,
  });
};

export const getPlanMejoraByIdService = async (id) => {
  const plan = await repo.getPlanMejoraById(id);
  if (!plan) {
    const err = new Error("Plan de mejora no encontrado");
    err.statusCode = 404;
    throw err;
  }
  return plan;
};

export const updatePlanMejoraService = async (id, updateData) => {
  const existing = await repo.getPlanMejoraById(id);
  if (!existing) {
    const err = new Error("Plan de mejora no encontrado");
    err.statusCode = 404;
    throw err;
  }
  return await repo.updatePlanMejora(id, updateData);
};

export const deletePlanMejoraService = async (id) => {
  const existing = await repo.getPlanMejoraById(id);
  if (!existing) {
    const err = new Error("Plan de mejora no encontrado");
    err.statusCode = 404;
    throw err;
  }
  return await repo.deletePlanMejora(id);
};

// ==========================================
// 10. DASHBOARD STATS
// ==========================================

export const getDashboardStatsService = async (queryParams = {}) => {
  return await repo.getDashboardStats(queryParams.id_periodo || null);
};
