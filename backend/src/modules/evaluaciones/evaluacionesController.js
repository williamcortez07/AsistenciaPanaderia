import * as service from "./evaluacionesService.js";
import { asyncWrapper } from "../../utils/asyncWrappers.js";

// ==========================================
// 1. PERIODOS DE EVALUACIÓN
// ==========================================

export const createPeriodo = asyncWrapper(async (req, res) => {
  const result = await service.createPeriodoService(req.body);
  res.status(201).json({
    success: true,
    message: "Periodo de evaluación creado exitosamente",
    data: result,
  });
});

export const getPeriodos = asyncWrapper(async (req, res) => {
  const result = await service.getPeriodosService(req.query);
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
});

export const getPeriodoById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.getPeriodoByIdService(id);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const updatePeriodo = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.updatePeriodoService(id, req.body);
  res.status(200).json({
    success: true,
    message: "Periodo de evaluación actualizado exitosamente",
    data: result,
  });
});

export const updateEstadoPeriodo = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const result = await service.updateEstadoPeriodoService(id, estado);
  res.status(200).json({
    success: true,
    message: `Estado del periodo actualizado a '${estado}'`,
    data: result,
  });
});

// ==========================================
// 2. CRITERIOS DE EVALUACIÓN (CATÁLOGO BASE)
// ==========================================

export const createCriterio = asyncWrapper(async (req, res) => {
  const result = await service.createCriterioService(req.body);
  res.status(201).json({
    success: true,
    message: "Criterio de evaluación creado exitosamente",
    data: result,
  });
});

export const getCriterios = asyncWrapper(async (req, res) => {
  const result = await service.getCriteriosService(req.query);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getCriterioById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.getCriterioByIdService(id);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const updateCriterio = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.updateCriterioService(id, req.body);
  res.status(200).json({
    success: true,
    message: "Criterio de evaluación actualizado exitosamente",
    data: result,
  });
});

export const deleteCriterio = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.deleteCriterioService(id);
  res.status(200).json({
    success: true,
    message: "Criterio de evaluación eliminado exitosamente",
    data: result,
  });
});

// ==========================================
// 3. CRITERIOS POR PERIODO
// ==========================================

export const addCriterioPeriodo = asyncWrapper(async (req, res) => {
  const { id_periodo } = req.params;
  const data = { ...req.body, id_periodo };
  const result = await service.addCriterioPeriodoService(data);
  res.status(201).json({
    success: true,
    message: "Criterio asignado al periodo exitosamente",
    data: result,
  });
});

export const getCriteriosByPeriodoId = asyncWrapper(async (req, res) => {
  const { id_periodo } = req.params;
  const result = await service.getCriteriosByPeriodoIdService(id_periodo);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const updateCriterioPeriodo = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.updateCriterioPeriodoService(id, req.body);
  res.status(200).json({
    success: true,
    message: "Configuración de criterio por periodo actualizada",
    data: result,
  });
});

export const deleteCriterioPeriodo = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.deleteCriterioPeriodoService(id);
  res.status(200).json({
    success: true,
    message: "Criterio removido del periodo exitosamente",
    data: result,
  });
});

// ==========================================
// 4. EVALUACIONES DE DESEMPEÑO
// ==========================================

export const createEvaluacion = asyncWrapper(async (req, res) => {
  const result = await service.createEvaluacionService(req.body);
  res.status(201).json({
    success: true,
    message: "Evaluación de desempeño iniciada exitosamente",
    data: result,
  });
});

export const getEvaluaciones = asyncWrapper(async (req, res) => {
  const result = await service.getEvaluacionesService(req.query);
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
});

export const getEvaluacionById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.getEvaluacionByIdService(id);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const updateEvaluacion = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.updateEvaluacionService(id, req.body);
  res.status(200).json({
    success: true,
    message: "Evaluación de desempeño actualizada exitosamente",
    data: result,
  });
});

export const updateEstadoEvaluacion = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const result = await service.updateEstadoEvaluacionService(id, estado);
  res.status(200).json({
    success: true,
    message: `Estado de la evaluación cambiado a '${estado}'`,
    data: result,
  });
});

export const calcularEvaluacion = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.calcularEvaluacionService(id);
  res.status(200).json({
    success: true,
    message: "Puntuación total de la evaluación calculada y actualizada exitosamente",
    data: result,
  });
});

// ==========================================
// 5. RESULTADOS DE LA CHECKLIST BULK
// ==========================================

export const getResultadosByEvaluacionId = asyncWrapper(async (req, res) => {
  const { id_evaluacion } = req.params;
  const evaluacion = await service.getEvaluacionByIdService(id_evaluacion);
  res.status(200).json({
    success: true,
    data: evaluacion.resultados_checklist,
  });
});

export const saveResultadosBulk = asyncWrapper(async (req, res) => {
  const { id_evaluacion } = req.params;
  const { resultados } = req.body;
  const result = await service.saveResultadosBulkService(id_evaluacion, resultados);
  res.status(200).json({
    success: true,
    message: "Resultados de la checklist guardados y puntuación recalculada exitosamente",
    data: result,
  });
});

// ==========================================
// 6. OBJETIVOS DE EMPLEADO
// ==========================================

export const createObjetivo = asyncWrapper(async (req, res) => {
  const result = await service.createObjetivoService(req.body);
  res.status(201).json({
    success: true,
    message: "Objetivo asignado exitosamente al empleado",
    data: result,
  });
});

export const getObjetivos = asyncWrapper(async (req, res) => {
  const result = await service.getObjetivosService(req.query);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getObjetivoById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.getObjetivoByIdService(id);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const updateObjetivo = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.updateObjetivoService(id, req.body);
  res.status(200).json({
    success: true,
    message: "Objetivo de empleado actualizado exitosamente",
    data: result,
  });
});

export const deleteObjetivo = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.deleteObjetivoService(id);
  res.status(200).json({
    success: true,
    message: "Objetivo de empleado eliminado exitosamente",
    data: result,
  });
});

// ==========================================
// 7. PREGUNTAS DE EVALUACIÓN
// ==========================================

export const getPreguntas = asyncWrapper(async (req, res) => {
  const result = await service.getPreguntasService(req.query);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getPreguntaById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.getPreguntaByIdService(id);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const createPregunta = asyncWrapper(async (req, res) => {
  const result = await service.createPreguntaService(req.body);
  res.status(201).json({
    success: true,
    message: "Pregunta del checklist creada exitosamente",
    data: result,
  });
});

export const updatePregunta = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.updatePreguntaService(id, req.body);
  res.status(200).json({
    success: true,
    message: "Pregunta del checklist actualizada exitosamente",
    data: result,
  });
});

export const deletePregunta = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.deletePreguntaService(id);
  res.status(200).json({
    success: true,
    message: "Pregunta del checklist eliminada exitosamente",
    data: result,
  });
});

// ==========================================
// 8. RESPUESTAS DETALLADAS DEL CHECKLIST
// ==========================================

export const getRespuestasByEvaluacionId = asyncWrapper(async (req, res) => {
  const { id_evaluacion } = req.params;
  const result = await service.getRespuestasByEvaluacionIdService(id_evaluacion);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const saveRespuestasItemizedBulk = asyncWrapper(async (req, res) => {
  const { id_evaluacion } = req.params;
  const userId = req.user ? req.user.id : null;
  const result = await service.saveRespuestasItemizedBulkService(id_evaluacion, {
    ...req.body,
    userId,
  });
  res.status(200).json({
    success: true,
    message: "Checklist completado y evaluación calculada exitosamente",
    data: result,
  });
});

// ==========================================
// 9. PLANES DE MEJORA CONTINUA
// ==========================================

export const getPlanesMejora = asyncWrapper(async (req, res) => {
  const result = await service.getPlanesMejoraService(req.query);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getPlanMejoraById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.getPlanMejoraByIdService(id);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const createPlanMejora = asyncWrapper(async (req, res) => {
  const result = await service.createPlanMejoraService(req.body);
  res.status(201).json({
    success: true,
    message: "Plan de mejora creado exitosamente",
    data: result,
  });
});

export const updatePlanMejora = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.updatePlanMejoraService(id, req.body);
  res.status(200).json({
    success: true,
    message: "Plan de mejora actualizado exitosamente",
    data: result,
  });
});

export const deletePlanMejora = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await service.deletePlanMejoraService(id);
  res.status(200).json({
    success: true,
    message: "Plan de mejora eliminado exitosamente",
    data: result,
  });
});

// ==========================================
// 10. METRICAS Y DASHBOARD DE EVALUACIÓN
// ==========================================

export const getDashboardStats = asyncWrapper(async (req, res) => {
  const result = await service.getDashboardStatsService(req.query);
  res.status(200).json({
    success: true,
    data: result,
  });
});
