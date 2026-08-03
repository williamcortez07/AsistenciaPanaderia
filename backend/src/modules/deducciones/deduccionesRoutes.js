import { Router } from "express";
import * as deduccionController from "./deduccionesController.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import {
  createDeduccionSchema,
  updateDeduccionSchema,
  deduccionIdParamSchema,
  getDeduccionByNameSchema,
  getDeduccionesQuerySchema,
} from "./deduccionesSchema.js";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * components:
 *   schemas:
 *     Deduccion:
 *       type: object
 *       required:
 *         - id
 *         - nombre
 *         - tipo
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *           example: "INSS Laboral"
 *         descripcion:
 *           type: string
 *           nullable: true
 *         tipo:
 *           type: string
 *           enum: [porcentaje, monto_fijo]
 *         porcentaje:
 *           type: number
 *           nullable: true
 *           example: 7.00
 *         monto_fijo:
 *           type: number
 *           nullable: true
 *           example: null
 *       example:
 *         id: "b47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         nombre: "INSS Laboral"
 *         descripcion: "Aporte del trabajador al seguro social"
 *         tipo: "porcentaje"
 *         porcentaje: 7.00
 *         monto_fijo: null
 *
 *     DeduccionInput:
 *       type: object
 *       required:
 *         - nombre
 *         - tipo
 *       properties:
 *         nombre:
 *           type: string
 *           maxLength: 100
 *         descripcion:
 *           type: string
 *           nullable: true
 *         tipo:
 *           type: string
 *           enum: [porcentaje, monto_fijo]
 *         porcentaje:
 *           type: number
 *           nullable: true
 *         monto_fijo:
 *           type: number
 *           nullable: true
 *       example:
 *         nombre: "INSS Laboral"
 *         descripcion: "Aporte laboral legal"
 *         tipo: "porcentaje"
 *         porcentaje: 7.00
 */

/**
 * @openapi
 * /api/v1/deducciones:
 *   post:
 *     summary: Crear una nueva deducción
 *     tags:
 *       - Deducciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeduccionInput'
 *     responses:
 *       201:
 *         description: Deducción creada exitosamente.
 *       400:
 *         description: Datos inválidos o conflicto entre porcentaje y monto fijo.
 *       409:
 *         description: Nombre de deducción ya existente.
 *
 *   get:
 *     summary: Listar deducciones
 *     tags:
 *       - Deducciones
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
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [porcentaje, monto_fijo]
 *     responses:
 *       200:
 *         description: Listado obtenido con éxito.
 */
router.post(
  "/",
  validateRequest(createDeduccionSchema),
  deduccionController.createDeduccion,
);

router.get(
  "/",
  validateRequest(getDeduccionesQuerySchema),
  deduccionController.getDeducciones,
);

/**
 * @openapi
 * /api/v1/deducciones/nombre/{nombre}:
 *   get:
 *     summary: Obtener deducción por nombre
 *     tags:
 *       - Deducciones
 *     parameters:
 *       - in: path
 *         name: nombre
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deducción encontrada.
 *       404:
 *         description: Deducción no encontrada.
 */
router.get(
  "/nombre/:nombre",
  validateRequest(getDeduccionByNameSchema),
  deduccionController.getDeduccionByName,
);

/**
 * @openapi
 * /api/v1/deducciones/{id}:
 *   get:
 *     summary: Obtener deducción por ID
 *     tags:
 *       - Deducciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deducción encontrada.
 *       404:
 *         description: Deducción no encontrada.
 *
 *   put:
 *     summary: Actualizar deducción
 *     tags:
 *       - Deducciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deducción actualizada exitosamente.
 */
router.get(
  "/:id",
  validateRequest(deduccionIdParamSchema),
  deduccionController.getDeduccionById,
);

router.put(
  "/:id",
  validateRequest(updateDeduccionSchema),
  deduccionController.updateDeduccion,
);

export default router;
