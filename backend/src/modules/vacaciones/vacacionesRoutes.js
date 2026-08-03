import { Router } from "express";
import * as vacacionController from "./vacacionesController.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import {
  createVacacionSchema,
  updateVacacionSchema,
  vacacionIdParamSchema,
  getVacacionesQuerySchema,
} from "./vacacionesSchema.js";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * components:
 *   schemas:
 *     Vacacion:
 *       type: object
 *       required:
 *         - id
 *         - id_empleado
 *         - fecha_inicio
 *         - fecha_fin
 *         - dias
 *         - fecha_solicitud
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         id_empleado:
 *           type: string
 *           format: uuid
 *         fecha_inicio:
 *           type: string
 *           format: date
 *           example: "2026-09-01"
 *         fecha_fin:
 *           type: string
 *           format: date
 *           example: "2026-09-10"
 *         dias:
 *           type: integer
 *           example: 7
 *         motivo:
 *           type: string
 *           nullable: true
 *           example: "Vacaciones anuales acumuladas"
 *         fecha_solicitud:
 *           type: string
 *           format: date-time
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
 *       example:
 *         id: "c47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         id_empleado: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         fecha_inicio: "2026-09-01"
 *         fecha_fin: "2026-09-10"
 *         dias: 7
 *         motivo: "Vacaciones descansadas"
 *         fecha_solicitud: "2026-08-03T09:00:00.000Z"
 *         codigo_empleado: "EMP-001"
 *         nombres: "Juan"
 *         apellidos: "Pérez"
 *         cargo_nombre: "SUPERVISOR"
 *
 *     VacacionInput:
 *       type: object
 *       required:
 *         - id_empleado
 *         - fecha_inicio
 *         - fecha_fin
 *         - dias
 *       properties:
 *         id_empleado:
 *           type: string
 *           format: uuid
 *         fecha_inicio:
 *           type: string
 *           format: date
 *           example: "2026-09-01"
 *         fecha_fin:
 *           type: string
 *           format: date
 *           example: "2026-09-10"
 *         dias:
 *           type: integer
 *           minimum: 1
 *         motivo:
 *           type: string
 *           nullable: true
 *       example:
 *         id_empleado: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         fecha_inicio: "2026-09-01"
 *         fecha_fin: "2026-09-10"
 *         dias: 7
 *         motivo: "Vacaciones familiares"
 */

/**
 * @openapi
 * /api/v1/vacaciones:
 *   post:
 *     summary: Solicitar vacaciones
 *     tags:
 *       - Vacaciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VacacionInput'
 *     responses:
 *       201:
 *         description: Vacación registrada con éxito.
 *       400:
 *         description: Fechas o cantidad de días no válidos.
 *       404:
 *         description: Empleado no encontrado.
 *
 *   get:
 *     summary: Listar o consultar historial de vacaciones
 *     tags:
 *       - Vacaciones
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
 *         name: id_empleado
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: fecha_desde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fecha_hasta
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Historial de vacaciones devuelto exitosamente.
 */
router.post(
  "/",
  validateRequest(createVacacionSchema),
  vacacionController.createVacacion,
);

router.get(
  "/",
  validateRequest(getVacacionesQuerySchema),
  vacacionController.getVacaciones,
);

/**
 * @openapi
 * /api/v1/vacaciones/{id}:
 *   get:
 *     summary: Obtener registro de vacaciones por ID
 *     tags:
 *       - Vacaciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Registro encontrado.
 *       404:
 *         description: Registro no encontrado.
 *
 *   put:
 *     summary: Actualizar registro de vacaciones
 *     tags:
 *       - Vacaciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Registro actualizado exitosamente.
 */
router.get(
  "/:id",
  validateRequest(vacacionIdParamSchema),
  vacacionController.getVacacionById,
);

router.put(
  "/:id",
  validateRequest(updateVacacionSchema),
  vacacionController.updateVacacion,
);

export default router;
