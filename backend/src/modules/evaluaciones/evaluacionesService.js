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
