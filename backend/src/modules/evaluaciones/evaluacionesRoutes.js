import { Router } from "express";
import * as controller from "./evaluacionesController.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import {
  createPeriodoSchema,
  updatePeriodoSchema,
  updateEstadoPeriodoSchema,
  getPeriodosQuerySchema,
  createCriterioSchema,
  updateCriterioSchema,
  getCriteriosQuerySchema,
  createCriterioPeriodoSchema,
  updateCriterioPeriodoSchema,
  createEvaluacionSchema,
  updateEvaluacionSchema,
  updateEstadoEvaluacionSchema,
  getEvaluacionesQuerySchema,
  saveResultadosBulkSchema,
  createObjetivoSchema,
  updateObjetivoSchema,
  getObjetivosQuerySchema,
  genericIdParamSchema,
  genericPeriodoIdParamSchema,
  genericEvaluacionIdParamSchema,
  createPreguntaSchema,
  updatePreguntaSchema,
  saveRespuestasItemizedBulkSchema,
  createPlanMejoraSchema,
  updatePlanMejoraSchema,
} from "./evaluacionesSchema.js";

const router = Router();

// Middleware de autenticación global para el módulo
router.use(authenticate);

// ==========================================
// 0. METRICAS Y DASHBOARD DE EVALUACIÓN
// ==========================================
router.get("/dashboard/stats", controller.getDashboardStats);

// ==========================================
// 0.1 PREGUNTAS DE EVALUACIÓN (CHECKLIST)
// ==========================================
router.get("/preguntas", controller.getPreguntas);
router.post("/preguntas", validateRequest(createPreguntaSchema), controller.createPregunta);
router.get("/preguntas/:id", validateRequest(genericIdParamSchema), controller.getPreguntaById);
router.put("/preguntas/:id", validateRequest(updatePreguntaSchema), controller.updatePregunta);
router.delete("/preguntas/:id", validateRequest(genericIdParamSchema), controller.deletePregunta);

// ==========================================
// 0.2 PLANES DE MEJORA CONTINUA
// ==========================================
router.get("/planes-mejora", controller.getPlanesMejora);
router.post("/planes-mejora", validateRequest(createPlanMejoraSchema), controller.createPlanMejora);
router.get("/planes-mejora/:id", validateRequest(genericIdParamSchema), controller.getPlanMejoraById);
router.put("/planes-mejora/:id", validateRequest(updatePlanMejoraSchema), controller.updatePlanMejora);
router.delete("/planes-mejora/:id", validateRequest(genericIdParamSchema), controller.deletePlanMejora);

/**
 * @openapi
 * components:
 *   schemas:
 *     PeriodoEvaluacion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *           example: "Evaluación 1er Semestre 2026"
 *         fecha_inicio:
 *           type: string
 *           format: date
 *           example: "2026-01-01"
 *         fecha_fin:
 *           type: string
 *           format: date
 *           example: "2026-06-30"
 *         duracion_meses:
 *           type: integer
 *           example: 6
 *         estado:
 *           type: string
 *           enum: [abierto, cerrado, cancelado]
 *           example: "abierto"
 *
 *     CriterioEvaluacion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *           example: "Responsabilidad y Puntualidad"
 *         descripcion:
 *           type: string
 *           example: "Cumplimiento de tareas asignadas e itinerarios de trabajo."
 *         activo:
 *           type: boolean
 *           example: true
 *         orden:
 *           type: integer
 *           example: 1
 *
 *     EvaluacionDesempeno:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         id_empleado:
 *           type: string
 *           format: uuid
 *         id_periodo:
 *           type: string
 *           format: uuid
 *         id_evaluador:
 *           type: string
 *           format: uuid
 *         fecha_evaluacion:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: string
 *           enum: [borrador, en_proceso, completada, aprobada, cancelada]
 *         puntuacion_total:
 *           type: number
 *           format: float
 *           example: 92.50
 *         observaciones:
 *           type: string
 *
 *     ObjetivoEmpleado:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         id_empleado:
 *           type: string
 *           format: uuid
 *         id_periodo:
 *           type: string
 *           format: uuid
 *         titulo:
 *           type: string
 *           example: "Incrementar productividad de producción un 15%"
 *         descripcion:
 *           type: string
 *         meta:
 *           type: number
 *           example: 100
 *         resultado:
 *           type: number
 *           example: 95
 *         porcentaje_cumplimiento:
 *           type: number
 *           example: 95.00
 *         estado:
 *           type: string
 *           enum: [pendiente, en_progreso, cumplido, no_cumplido]
 */

// ==========================================
// 1. PERIODOS DE EVALUACIÓN
// ==========================================

/**
 * @openapi
 * /api/v1/evaluaciones/periodos:
 *   post:
 *     summary: Crear un nuevo periodo de evaluación (semestral / 6 meses)
 *     tags: [Evaluaciones - Periodos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, fecha_inicio, fecha_fin]
 *             properties:
 *               nombre: { type: string, example: "Evaluación 1er Semestre 2026" }
 *               fecha_inicio: { type: string, format: date, example: "2026-01-01" }
 *               fecha_fin: { type: string, format: date, example: "2026-06-30" }
 *               duracion_meses: { type: integer, example: 6 }
 *               estado: { type: string, enum: [abierto, cerrado, cancelado], example: "abierto" }
 *     responses:
 *       201: { description: Periodo creado exitosamente }
 *   get:
 *     summary: Listar periodos de evaluación
 *     tags: [Evaluaciones - Periodos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: estado
 *         schema: { type: string, enum: [abierto, cerrado, cancelado] }
 *     responses:
 *       200: { description: Lista de periodos }
 */
router.post(
  "/periodos",
  validateRequest(createPeriodoSchema),
  controller.createPeriodo
);

router.get(
  "/periodos",
  validateRequest(getPeriodosQuerySchema),
  controller.getPeriodos
);

/**
 * @openapi
 * /api/v1/evaluaciones/periodos/{id}:
 *   get:
 *     summary: Obtener periodo por ID con sus criterios configurados
 *     tags: [Evaluaciones - Periodos]
 *   put:
 *     summary: Actualizar periodo de evaluación
 *     tags: [Evaluaciones - Periodos]
 */
router.get(
  "/periodos/:id",
  validateRequest(genericIdParamSchema),
  controller.getPeriodoById
);

router.put(
  "/periodos/:id",
  validateRequest(updatePeriodoSchema),
  controller.updatePeriodo
);

/**
 * @openapi
 * /api/v1/evaluaciones/periodos/{id}/estado:
 *   patch:
 *     summary: Cambiar el estado de un periodo (abierto/cerrado/cancelado)
 *     tags: [Evaluaciones - Periodos]
 */
router.patch(
  "/periodos/:id/estado",
  validateRequest(updateEstadoPeriodoSchema),
  controller.updateEstadoPeriodo
);

// ==========================================
// 2. CRITERIOS DE EVALUACIÓN (CATÁLOGO BASE)
// ==========================================

/**
 * @openapi
 * /api/v1/evaluaciones/criterios:
 *   post:
 *     summary: Crear un nuevo criterio en el catálogo (Checklist)
 *     tags: [Evaluaciones - Criterios Catálogo]
 *   get:
 *     summary: Consultar catálogo de criterios (Rendimiento, Iniciativa, Creatividad, etc.)
 *     tags: [Evaluaciones - Criterios Catálogo]
 */
router.post(
  "/criterios",
  validateRequest(createCriterioSchema),
  controller.createCriterio
);

router.get(
  "/criterios",
  validateRequest(getCriteriosQuerySchema),
  controller.getCriterios
);

/**
 * @openapi
 * /api/v1/evaluaciones/criterios/{id}:
 *   get:
 *     summary: Obtener criterio por ID
 *     tags: [Evaluaciones - Criterios Catálogo]
 *   put:
 *     summary: Editar criterio del catálogo
 *     tags: [Evaluaciones - Criterios Catálogo]
 *   delete:
 *     summary: Eliminar criterio del catálogo
 *     tags: [Evaluaciones - Criterios Catálogo]
 */
router.get(
  "/criterios/:id",
  validateRequest(genericIdParamSchema),
  controller.getCriterioById
);

router.put(
  "/criterios/:id",
  validateRequest(updateCriterioSchema),
  controller.updateCriterio
);

router.delete(
  "/criterios/:id",
  validateRequest(genericIdParamSchema),
  controller.deleteCriterio
);

// ==========================================
// 3. CRITERIOS POR PERIODO (CHECKLIST Y PONDERACIÓN)
// ==========================================

/**
 * @openapi
 * /api/v1/evaluaciones/periodos/{id_periodo}/criterios:
 *   post:
 *     summary: Asignar criterio a un periodo con su ponderación (%)
 *     tags: [Evaluaciones - Checklist Periodo]
 *   get:
 *     summary: Obtener la checklist y ponderaciones configuradas para un periodo
 *     tags: [Evaluaciones - Checklist Periodo]
 */
router.post(
  "/periodos/:id_periodo/criterios",
  validateRequest(createCriterioPeriodoSchema),
  controller.addCriterioPeriodo
);

router.get(
  "/periodos/:id_periodo/criterios",
  validateRequest(genericPeriodoIdParamSchema),
  controller.getCriteriosByPeriodoId
);

/**
 * @openapi
 * /api/v1/evaluaciones/periodos/{id_periodo}/criterios/{id}:
 *   put:
 *     summary: Editar la ponderación u orden del criterio dentro del periodo
 *     tags: [Evaluaciones - Checklist Periodo]
 *   delete:
 *     summary: Remover un criterio de la checklist del periodo
 *     tags: [Evaluaciones - Checklist Periodo]
 */
router.put(
  "/periodos/:id_periodo/criterios/:id",
  validateRequest(updateCriterioPeriodoSchema),
  controller.updateCriterioPeriodo
);

router.delete(
  "/periodos/:id_periodo/criterios/:id",
  validateRequest(genericIdParamSchema),
  controller.deleteCriterioPeriodo
);

// ==========================================
// 4. OBJETIVOS DE EMPLEADOS
// ==========================================

/**
 * @openapi
 * /api/v1/evaluaciones/objetivos:
 *   post:
 *     summary: Asignar un nuevo objetivo a un empleado para un periodo
 *     tags: [Evaluaciones - Objetivos Empleado]
 *   get:
 *     summary: Listar objetivos filtrando por empleado, periodo o estado
 *     tags: [Evaluaciones - Objetivos Empleado]
 */
router.post(
  "/objetivos",
  validateRequest(createObjetivoSchema),
  controller.createObjetivo
);

router.get(
  "/objetivos",
  validateRequest(getObjetivosQuerySchema),
  controller.getObjetivos
);

/**
 * @openapi
 * /api/v1/evaluaciones/objetivos/{id}:
 *   get:
 *     summary: Obtener detalle de un objetivo por ID
 *     tags: [Evaluaciones - Objetivos Empleado]
 *   put:
 *     summary: Actualizar resultado, % cumplimiento o estado del objetivo
 *     tags: [Evaluaciones - Objetivos Empleado]
 *   delete:
 *     summary: Eliminar un objetivo de empleado
 *     tags: [Evaluaciones - Objetivos Empleado]
 */
router.get(
  "/objetivos/:id",
  validateRequest(genericIdParamSchema),
  controller.getObjetivoById
);

router.put(
  "/objetivos/:id",
  validateRequest(updateObjetivoSchema),
  controller.updateObjetivo
);

router.delete(
  "/objetivos/:id",
  validateRequest(genericIdParamSchema),
  controller.deleteObjetivo
);

// ==========================================
// 5. EVALUACIONES DE DESEMPEÑO INDIVIDUALES
// ==========================================

/**
 * @openapi
 * /api/v1/evaluaciones:
 *   post:
 *     summary: Crear / Iniciar evaluación a un empleado en un periodo
 *     tags: [Evaluaciones - Evaluaciones Empleado]
 *   get:
 *     summary: Listar evaluaciones con paginación y filtros (empleado, periodo, evaluador, estado)
 *     tags: [Evaluaciones - Evaluaciones Empleado]
 */
router.post(
  "/",
  validateRequest(createEvaluacionSchema),
  controller.createEvaluacion
);

router.get(
  "/",
  validateRequest(getEvaluacionesQuerySchema),
  controller.getEvaluaciones
);

/**
 * @openapi
 * /api/v1/evaluaciones/{id}:
 *   get:
 *     summary: Obtener evaluación por ID (incluyendo checklist calificada y objetivos)
 *     tags: [Evaluaciones - Evaluaciones Empleado]
 *   put:
 *     summary: Actualizar datos de la evaluación (evaluador, observaciones)
 *     tags: [Evaluaciones - Evaluaciones Empleado]
 */
router.get(
  "/:id",
  validateRequest(genericIdParamSchema),
  controller.getEvaluacionById
);

router.put(
  "/:id",
  validateRequest(updateEvaluacionSchema),
  controller.updateEvaluacion
);

/**
 * @openapi
 * /api/v1/evaluaciones/{id}/estado:
 *   patch:
 *     summary: Cambiar estado de la evaluación (borrador, en_proceso, completada, aprobada, cancelada)
 *     tags: [Evaluaciones - Evaluaciones Empleado]
 */
router.patch(
  "/:id/estado",
  validateRequest(updateEstadoEvaluacionSchema),
  controller.updateEstadoEvaluacion
);

/**
 * @openapi
 * /api/v1/evaluaciones/{id}/calcular:
 *   post:
 *     summary: Recalcular la puntuación total ponderada de una evaluación
 *     tags: [Evaluaciones - Evaluaciones Empleado]
 */
router.post(
  "/:id/calcular",
  validateRequest(genericIdParamSchema),
  controller.calcularEvaluacion
);

// ==========================================
// 6. RESULTADOS DE CHECKLIST BULK
// ==========================================

/**
 * @openapi
 * /api/v1/evaluaciones/{id_evaluacion}/resultados:
 * /api/v1/evaluaciones/{id_evaluacion}/respuestas:
 *   get:
 *     summary: Obtener calificaciones de la checklist para una evaluación específica
 *     tags: [Evaluaciones - Checklist Resultados]
 *   put:
 *     summary: Guardar / Actualizar en lote (bulk) las puntuaciones y comentarios de la checklist
 *     tags: [Evaluaciones - Checklist Resultados]
 */
router.get(
  "/:id_evaluacion/respuestas",
  validateRequest(genericEvaluacionIdParamSchema),
  controller.getRespuestasByEvaluacionId
);

router.put(
  "/:id_evaluacion/respuestas/bulk",
  validateRequest(saveRespuestasItemizedBulkSchema),
  controller.saveRespuestasItemizedBulk
);

router.get(
  "/:id_evaluacion/resultados",
  validateRequest(genericEvaluacionIdParamSchema),
  controller.getResultadosByEvaluacionId
);

router.put(
  "/:id_evaluacion/resultados/bulk",
  validateRequest(saveResultadosBulkSchema),
  controller.saveResultadosBulk
);

export default router;
