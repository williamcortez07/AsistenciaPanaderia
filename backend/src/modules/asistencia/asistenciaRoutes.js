import { Router } from "express";
import * as asistenciaController from "./asistenciaController.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import {
  checkInSchema,
  checkOutSchema,
  updateAsistenciaSchema,
  asistenciaIdParamSchema,
  getAsistenciasQuerySchema,
} from "./asistenciaSchema.js";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * components:
 *   schemas:
 *     Asistencia:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         id_empleado:
 *           type: string
 *           format: uuid
 *         fecha:
 *           type: string
 *           format: date
 *           example: "2026-08-03"
 *         hora_entrada:
 *           type: string
 *           example: "08:05:22"
 *         hora_salida:
 *           type: string
 *           nullable: true
 *           example: "17:01:10"
 *         estado:
 *           type: string
 *           enum: [presente, ausente, tardanza, permiso]
 *           example: "tardanza"
 *         observacion:
 *           type: string
 *           nullable: true
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
 *
 *     CheckInInput:
 *       type: object
 *       required:
 *         - id_empleado
 *       properties:
 *         id_empleado:
 *           type: string
 *           format: uuid
 *         observacion:
 *           type: string
 *           nullable: true
 *       example:
 *         id_empleado: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         observacion: "Llegada con leve retraso por tráfico"
 *
 *     CheckOutInput:
 *       type: object
 *       required:
 *         - id_empleado
 *       properties:
 *         id_empleado:
 *           type: string
 *           format: uuid
 *         observacion:
 *           type: string
 *           nullable: true
 *       example:
 *         id_empleado: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 */

/**
 * @openapi
 * /api/v1/asistencia/check-in:
 *   post:
 *     summary: Registrar marcado de entrada (Check-in)
 *     description: Registra la hora de entrada del empleado para el día de hoy. Evalúa automáticamente si es tardanza según el cargo.
 *     tags:
 *       - Asistencia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckInInput'
 *     responses:
 *       201:
 *         description: Check-in registrado exitosamente.
 *       400:
 *         description: Empleado no activo o datos no válidos.
 *       409:
 *         description: El empleado ya marcó entrada el día de hoy.
 */
router.post(
  "/check-in",
  validateRequest(checkInSchema),
  asistenciaController.checkIn,
);

/**
 * @openapi
 * /api/v1/asistencia/check-out:
 *   post:
 *     summary: Registrar marcado de salida (Check-out)
 *     description: Actualiza la hora de salida para la asistencia del día actual del empleado.
 *     tags:
 *       - Asistencia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckOutInput'
 *     responses:
 *       200:
 *         description: Check-out registrado exitosamente.
 *       404:
 *         description: No hay registro de entrada para el día de hoy.
 *       409:
 *         description: La salida ya fue registrada previamente hoy.
 */
router.post(
  "/check-out",
  validateRequest(checkOutSchema),
  asistenciaController.checkOut,
);

/**
 * @openapi
 * /api/v1/asistencia:
 *   get:
 *     summary: Consultar reporte o historial de asistencias
 *     tags:
 *       - Asistencia
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
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [presente, ausente, tardanza, permiso]
 *     responses:
 *       200:
 *         description: Listado de asistencias devuelto exitosamente.
 */
router.get(
  "/",
  validateRequest(getAsistenciasQuerySchema),
  asistenciaController.getAsistencias,
);

/**
 * @openapi
 * /api/v1/asistencia/{id}:
 *   get:
 *     summary: Obtener registro de asistencia por ID
 *     tags:
 *       - Asistencia
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
 *     summary: Actualizar registro de asistencia (Administrativo)
 *     tags:
 *       - Asistencia
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
  validateRequest(asistenciaIdParamSchema),
  asistenciaController.getAsistenciaById,
);

router.put(
  "/:id",
  validateRequest(updateAsistenciaSchema),
  asistenciaController.updateAsistencia,
);

export default router;
