import { Router } from "express";
import * as planillaController from "./planillaController.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import {
  createPlanillaSchema,
  updatePlanillaEstadoSchema,
  planillaIdParamSchema,
  getPlanillasQuerySchema,
} from "./planillaSchema.js";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * components:
 *   schemas:
 *     Planilla:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         mes:
 *           type: integer
 *           example: 8
 *         anio:
 *           type: integer
 *           example: 2026
 *         fecha_generacion:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: string
 *           enum: [generada, pagada, anulada]
 *           example: "generada"
 *
 *     PlanillaInput:
 *       type: object
 *       required:
 *         - mes
 *         - anio
 *       properties:
 *         mes:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 8
 *         anio:
 *           type: integer
 *           minimum: 2000
 *           example: 2026
 *
 *     PlanillaEstadoInput:
 *       type: object
 *       required:
 *         - estado
 *       properties:
 *         estado:
 *           type: string
 *           enum: [pagada, anulada]
 *           example: "pagada"
 *
 *     DetallePlanillaItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         id_planilla:
 *           type: string
 *           format: uuid
 *         id_empleado:
 *           type: string
 *           format: uuid
 *         salario_base:
 *           type: number
 *           example: 15000.00
 *         total_deduccion:
 *           type: number
 *           example: 1050.00
 *         salario_neto:
 *           type: number
 *           example: 13950.00
 *         codigo_empleado:
 *           type: string
 *           example: "EMP-001"
 *         nombres:
 *           type: string
 *           example: "Juan"
 *         apellidos:
 *           type: string
 *           example: "Pérez"
 *         cargo_nombre:
 *           type: string
 *           example: "SUPERVISOR"
 */

/**
 * @openapi
 * /api/v1/planilla:
 *   post:
 *     summary: Generar planilla mensual con sus detalles
 *     description: Calcula automáticamente la nómina para todos los empleados activos procesando sus salarios base y deducciones asignadas.
 *     tags:
 *       - Planilla
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlanillaInput'
 *     responses:
 *       201:
 *         description: Planilla y detalles generados exitosamente.
 *       400:
 *         description: Parámetros inválidos o sin empleados activos.
 *       409:
 *         description: La planilla para ese período ya existe.
 *
 *   get:
 *     summary: Listar planillas registradas
 *     tags:
 *       - Planilla
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [generada, pagada, anulada]
 *     responses:
 *       200:
 *         description: Listado devuelto exitosamente.
 */
router.post(
  "/",
  validateRequest(createPlanillaSchema),
  planillaController.createPlanilla,
);

router.get(
  "/",
  validateRequest(getPlanillasQuerySchema),
  planillaController.getPlanillas,
);

/**
 * @openapi
 * /api/v1/planilla/{id}:
 *   get:
 *     summary: Obtener resumen cabecera de planilla por ID
 *     tags:
 *       - Planilla
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Planilla encontrada.
 *       404:
 *         description: Planilla no encontrada.
 */
router.get(
  "/:id",
  validateRequest(planillaIdParamSchema),
  planillaController.getPlanillaById,
);

/**
 * @openapi
 * /api/v1/planilla/{id}/detalle:
 *   get:
 *     summary: Obtener el detalle completo de nómina de una planilla
 *     description: Subrecurso de solo lectura que expone las líneas calculadas de salario base, deducciones y neto por cada empleado.
 *     tags:
 *       - Planilla
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalle de la planilla recuperado exitosamente con resumen acumulado.
 *       404:
 *         description: Planilla no encontrada.
 */
router.get(
  "/:id/detalle",
  validateRequest(planillaIdParamSchema),
  planillaController.getDetallePlanilla,
);

/**
 * @openapi
 * /api/v1/planilla/{id}/estado:
 *   patch:
 *     summary: Cambiar estado de la planilla (Pagada / Anulada)
 *     tags:
 *       - Planilla
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlanillaEstadoInput'
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente.
 *       400:
 *         description: Cambio de estado no permitido.
 *       404:
 *         description: Planilla no encontrada.
 */
router.patch(
  "/:id/estado",
  validateRequest(updatePlanillaEstadoSchema),
  planillaController.updatePlanillaEstado,
);

export default router;
