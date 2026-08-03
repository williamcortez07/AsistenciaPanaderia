import { Router } from "express";
import * as empleadoController from "./empleadoController.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import {
  createEmpleadoSchema,
  updateEmpleadoSchema,
  empleadoIdParamSchema,
  getEmpleadoByCodigoSchema,
  getEmpleadosQuerySchema,
  assignDeduccionSchema,
  removeDeduccionSchema,
} from "./empleadoSchema.js";

const router = Router();

// Todos los endpoints de empleados requieren autenticación
router.use(authenticate);

/**
 * @openapi
 * components:
 *   schemas:
 *     Empleado:
 *       type: object
 *       required:
 *         - id
 *         - id_cargo
 *         - codigo_empleado
 *         - cedula
 *         - nombres
 *         - apellidos
 *         - fecha_contratacion
 *         - salario_base
 *         - estado
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único del empleado (UUID v4).
 *         id_cargo:
 *           type: string
 *           format: uuid
 *           description: ID del cargo asignado.
 *         id_usuario:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID del usuario del sistema vinculado (opcional).
 *         codigo_empleado:
 *           type: string
 *           description: Código único interno del empleado.
 *         cedula:
 *           type: string
 *           description: Documento de identidad único.
 *         nombres:
 *           type: string
 *           description: Nombres del empleado.
 *         apellidos:
 *           type: string
 *           description: Apellidos del empleado.
 *         telefono:
 *           type: string
 *           nullable: true
 *           description: Número telefónico de contacto.
 *         direccion:
 *           type: string
 *           nullable: true
 *           description: Dirección de residencia.
 *         fecha_contratacion:
 *           type: string
 *           format: date
 *           example: "2026-01-15"
 *           description: Fecha de ingreso del empleado (YYYY-MM-DD).
 *         salario_base:
 *           type: number
 *           format: float
 *           example: 15000.00
 *           description: Salario base asignado.
 *         estado:
 *           type: string
 *           enum: [activo, inactivo, suspendido, retirado]
 *           description: Estado actual laboral del empleado.
 *         cargo_nombre:
 *           type: string
 *           description: Nombre del cargo asignado (desde JOIN).
 *         horario_entrada:
 *           type: string
 *           description: Hora de entrada asignada al cargo (desde JOIN).
 *         horario_salida:
 *           type: string
 *           description: Hora de salida asignada al cargo (desde JOIN).
 *       example:
 *         id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         id_cargo: "d3b07384-d113-4956-a5b6-76472251cf78"
 *         id_usuario: null
 *         codigo_empleado: "EMP-001"
 *         cedula: "001-010190-0001A"
 *         nombres: "Juan"
 *         apellidos: "Pérez"
 *         telefono: "+50588888888"
 *         direccion: "Managua, Nicaragua"
 *         fecha_contratacion: "2026-01-15"
 *         salario_base: 15000.00
 *         estado: "activo"
 *         cargo_nombre: "SUPERVISOR"
 *         horario_entrada: "08:00:00"
 *         horario_salida: "17:00:00"
 *
 *     EmpleadoInput:
 *       type: object
 *       required:
 *         - id_cargo
 *         - codigo_empleado
 *         - cedula
 *         - nombres
 *         - apellidos
 *         - fecha_contratacion
 *         - salario_base
 *       properties:
 *         id_cargo:
 *           type: string
 *           format: uuid
 *         id_usuario:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         codigo_empleado:
 *           type: string
 *           maxLength: 20
 *         cedula:
 *           type: string
 *           maxLength: 20
 *         nombres:
 *           type: string
 *           maxLength: 100
 *         apellidos:
 *           type: string
 *           maxLength: 100
 *         telefono:
 *           type: string
 *           nullable: true
 *         direccion:
 *           type: string
 *           nullable: true
 *         fecha_contratacion:
 *           type: string
 *           format: date
 *           example: "2026-01-15"
 *         salario_base:
 *           type: number
 *           minimum: 0
 *         estado:
 *           type: string
 *           enum: [activo, inactivo, suspendido, retirado]
 *           default: "activo"
 *       example:
 *         id_cargo: "d3b07384-d113-4956-a5b6-76472251cf78"
 *         codigo_empleado: "EMP-001"
 *         cedula: "001-010190-0001A"
 *         nombres: "Juan"
 *         apellidos: "Pérez"
 *         telefono: "+50588888888"
 *         direccion: "Managua, Nicaragua"
 *         fecha_contratacion: "2026-01-15"
 *         salario_base: 15000.00
 *         estado: "activo"
 *
 *     EmpleadoUpdate:
 *       type: object
 *       properties:
 *         id_cargo:
 *           type: string
 *           format: uuid
 *         id_usuario:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         codigo_empleado:
 *           type: string
 *         cedula:
 *           type: string
 *         nombres:
 *           type: string
 *         apellidos:
 *           type: string
 *         telefono:
 *           type: string
 *           nullable: true
 *         direccion:
 *           type: string
 *           nullable: true
 *         fecha_contratacion:
 *           type: string
 *           format: date
 *         salario_base:
 *           type: number
 *         estado:
 *           type: string
 *           enum: [activo, inactivo, suspendido, retirado]
 *       example:
 *         telefono: "+50587654321"
 *         salario_base: 16500.00
 *
 *     AssignDeduccionInput:
 *       type: object
 *       required:
 *         - id_deduccion
 *       properties:
 *         id_deduccion:
 *           type: string
 *           format: uuid
 *           description: ID único de la deducción a asignar al empleado.
 *       example:
 *         id_deduccion: "b47ac10b-58cc-4372-a567-0e02b2c3d479"
 */

/**
 * @openapi
 * /api/v1/empleados:
 *   post:
 *     summary: Registrar un nuevo empleado
 *     description: Registra a un empleado en el sistema verificando que su código y cédula no estén en uso.
 *     tags:
 *       - Empleados
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmpleadoInput'
 *     responses:
 *       201:
 *         description: Empleado creado exitosamente.
 *       400:
 *         description: Datos de entrada inválidos.
 *       409:
 *         description: El código de empleado o la cédula ya están registrados.
 *       500:
 *         description: Error interno del servidor.
 *
 *   get:
 *     summary: Obtener el listado de empleados
 *     description: Recupera empleados con soporte para paginación, filtro por estado y búsqueda por términos.
 *     tags:
 *       - Empleados
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [activo, inactivo, suspendido, retirado]
 *     responses:
 *       200:
 *         description: Lista de empleados obtenida con éxito.
 */
router.post(
  "/",
  validateRequest(createEmpleadoSchema),
  empleadoController.createEmpleado,
);

router.get(
  "/",
  validateRequest(getEmpleadosQuerySchema),
  empleadoController.getEmpleados,
);

/**
 * @openapi
 * /api/v1/empleados/codigo/{codigo}:
 *   get:
 *     summary: Obtener un empleado por su código
 *     tags:
 *       - Empleados
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Empleado encontrado con éxito.
 *       404:
 *         description: Empleado no encontrado.
 */
router.get(
  "/codigo/:codigo",
  validateRequest(getEmpleadoByCodigoSchema),
  empleadoController.getEmpleadoByCodigo,
);

/**
 * @openapi
 * /api/v1/empleados/{id}:
 *   get:
 *     summary: Obtener un empleado por su ID
 *     tags:
 *       - Empleados
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Empleado encontrado con éxito.
 *       404:
 *         description: Empleado no encontrado.
 *
 *   put:
 *     summary: Actualizar un empleado existente
 *     tags:
 *       - Empleados
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
 *             $ref: '#/components/schemas/EmpleadoUpdate'
 *     responses:
 *       200:
 *         description: Empleado actualizado exitosamente.
 *       404:
 *         description: Empleado no encontrado.
 *       409:
 *         description: Código o cédula duplicada.
 */
router.get(
  "/:id",
  validateRequest(empleadoIdParamSchema),
  empleadoController.getEmpleadoById,
);

router.put(
  "/:id",
  validateRequest(updateEmpleadoSchema),
  empleadoController.updateEmpleado,
);

/* ==========================================================================
   SUBRECURSO ANIDADO: EMPLEADO_DEDUCCIONES (/api/v1/empleados/{id}/deducciones)
   ========================================================================== */

/**
 * @openapi
 * /api/v1/empleados/{id}/deducciones:
 *   post:
 *     summary: Asignar una deducción a un empleado
 *     description: Vincula una deducción existente del catálogo a un empleado específico.
 *     tags:
 *       - Empleados - Deducciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del empleado.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignDeduccionInput'
 *     responses:
 *       201:
 *         description: Deducción asignada exitosamente.
 *       400:
 *         description: Error de validación de formato.
 *       404:
 *         description: El empleado o la deducción no existen.
 *       409:
 *         description: La deducción ya está asignada al empleado.
 *
 *   get:
 *     summary: Obtener todas las deducciones de un empleado
 *     description: Retorna el listado de deducciones aplicables a un empleado determinado.
 *     tags:
 *       - Empleados - Deducciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del empleado.
 *     responses:
 *       200:
 *         description: Listado de deducciones del empleado devuelto con éxito.
 *       404:
 *         description: Empleado no encontrado.
 */
router.post(
  "/:id/deducciones",
  validateRequest(assignDeduccionSchema),
  empleadoController.assignDeduccion,
);

router.get(
  "/:id/deducciones",
  validateRequest(empleadoIdParamSchema),
  empleadoController.getEmpleadoDeducciones,
);

/**
 * @openapi
 * /api/v1/empleados/{id}/deducciones/{deduccionId}:
 *   delete:
 *     summary: Remover una deducción asignada a un empleado
 *     description: Elimina el vínculo entre un empleado y una deducción específica.
 *     tags:
 *       - Empleados - Deducciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del empleado.
 *       - in: path
 *         name: deduccionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la deducción a desvincular.
 *     responses:
 *       200:
 *         description: Deducción removida del empleado exitosamente.
 *       404:
 *         description: Empleado o deducción no encontrada / no vinculada.
 */
router.delete(
  "/:id/deducciones/:deduccionId",
  validateRequest(removeDeduccionSchema),
  empleadoController.removeDeduccion,
);

export default router;
