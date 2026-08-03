import { Router } from "express";
import * as cargoController from "./cargoController.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import {
  createCargoSchema,
  updateCargoSchema,
  cargoIdParamSchema,
  getCargoByNameSchema,
  getCargosQuerySchema,
} from "./cargoSchema.js";

const router = Router();

// Todos los endpoints de cargos requieren autenticación
router.use(authenticate);

/**
 * @openapi
 * components:
 *   schemas:
 *     Cargo:
 *       type: object
 *       required:
 *         - id
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único autogenerado del cargo (UUID v4).
 *         name:
 *           type: string
 *           description: Nombre único identificador del cargo.
 *         description:
 *           type: string
 *           nullable: true
 *           description: Descripción detallada de las funciones del cargo.
 *         horario_entrada:
 *           type: string
 *           nullable: true
 *           example: "08:00:00"
 *           description: Hora de entrada asignada al cargo (HH:mm o HH:mm:ss).
 *         horario_salida:
 *           type: string
 *           nullable: true
 *           example: "17:00:00"
 *           description: Hora de salida asignada al cargo (HH:mm o HH:mm:ss).
 *       example:
 *         id: "d3b07384-d113-4956-a5b6-76472251cf78"
 *         name: "SUPERVISOR"
 *         description: "Supervisa las operaciones de turno."
 *         horario_entrada: "08:00:00"
 *         horario_salida: "17:00:00"
 *
 *     CargoInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Nombre único del cargo. Debe tener al menos 2 caracteres.
 *         description:
 *           type: string
 *           nullable: true
 *           description: Descripción opcional del cargo.
 *         horario_entrada:
 *           type: string
 *           nullable: true
 *           example: "08:00:00"
 *           description: Hora de entrada en formato HH:mm o HH:mm:ss.
 *         horario_salida:
 *           type: string
 *           nullable: true
 *           example: "17:00:00"
 *           description: Hora de salida en formato HH:mm o HH:mm:ss.
 *       example:
 *         name: "SUPERVISOR"
 *         description: "Supervisa las operaciones de turno."
 *         horario_entrada: "08:00:00"
 *         horario_salida: "17:00:00"
 *
 *     CargoUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Nombre único del cargo (opcional).
 *         description:
 *           type: string
 *           nullable: true
 *           description: Descripción opcional del cargo.
 *         horario_entrada:
 *           type: string
 *           nullable: true
 *           example: "08:00:00"
 *           description: Hora de entrada (opcional).
 *         horario_salida:
 *           type: string
 *           nullable: true
 *           example: "17:00:00"
 *           description: Hora de salida (opcional).
 *       example:
 *         description: "Descripción actualizada del puesto de supervisor"
 *         horario_salida: "18:00:00"
 */

/**
 * @openapi
 * /api/v1/cargos:
 *   post:
 *     summary: Crear un nuevo cargo
 *     description: Registra un cargo en el sistema validando que el nombre no colisione con uno existente.
 *     tags:
 *       - Cargos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CargoInput'
 *     responses:
 *       201:
 *         description: Cargo creado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cargo creado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Cargo'
 *       400:
 *         description: Error de validación en la estructura de los datos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflicto - El nombre del cargo ya está registrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   get:
 *     summary: Obtener todos los cargos
 *     description: Retorna un listado de cargos registrados con soporte para filtros de búsqueda y paginación.
 *     tags:
 *       - Cargos
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página a consultar (base 1).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Elementos máximos por página.
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Término de búsqueda parcial para filtrar por el nombre del cargo.
 *     responses:
 *       200:
 *         description: Lista de cargos recuperada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cargo'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Parámetros de búsqueda inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  validateRequest(createCargoSchema),
  cargoController.createCargo,
);

router.get(
  "/",
  validateRequest(getCargosQuerySchema),
  cargoController.getCargos,
);

/**
 * @openapi
 * /api/v1/cargos/nombre/{nombre}:
 *   get:
 *     summary: Obtener un cargo por su nombre
 *     description: Recupera un único cargo buscando por coincidencia exacta de su nombre.
 *     tags:
 *       - Cargos
 *     parameters:
 *       - in: path
 *         name: nombre
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre exacto del cargo.
 *     responses:
 *       200:
 *         description: Cargo encontrado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cargo'
 *       404:
 *         description: El cargo no existe en el sistema.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/nombre/:nombre",
  validateRequest(getCargoByNameSchema),
  cargoController.getCargoByName,
);

/**
 * @openapi
 * /api/v1/cargos/{id}:
 *   get:
 *     summary: Obtener un cargo por su ID
 *     description: Recupera un único cargo según su identificador único (UUID).
 *     tags:
 *       - Cargos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Identificador único UUID v4 del cargo.
 *     responses:
 *       200:
 *         description: Cargo encontrado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cargo'
 *       400:
 *         description: El identificador enviado en la ruta no es un UUID válido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: El cargo no existe en el sistema.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   put:
 *     summary: Actualizar un cargo existente
 *     description: Permite actualizar el nombre, descripción o los horarios de entrada/salida de un cargo en base a su ID.
 *     tags:
 *       - Cargos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Identificador único UUID v4 del cargo a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CargoUpdate'
 *     responses:
 *       200:
 *         description: Cargo actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cargo actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Cargo'
 *       400:
 *         description: El UUID es inválido o no se enviaron datos válidos para actualizar.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: El cargo no existe.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflicto - El nuevo nombre ya está ocupado por otro cargo.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:id",
  validateRequest(cargoIdParamSchema),
  cargoController.getCargoById,
);

router.put(
  "/:id",
  validateRequest(updateCargoSchema),
  cargoController.updateCargo,
);

export default router;
