import { Router } from "express";
import * as usuarioController from "./usuarioController.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  getUsersQuerySchema,
} from "./usuarioSchema.js";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginInput:
 *       type: object
 *       required:
 *         - correo
 *         - password
 *       properties:
 *         correo:
 *           type: string
 *           format: email
 *           example: "admin@empresa.com"
 *         password:
 *           type: string
 *           example: "123456"
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Inicio de sesión exitoso"
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             user:
 *               $ref: '#/components/schemas/Usuario'
 *
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         id_rol:
 *           type: string
 *           format: uuid
 *         nombre_rol:
 *           type: string
 *           example: "ADMINISTRADOR"
 *         correo:
 *           type: string
 *           format: email
 *         estado:
 *           type: string
 *           enum: [activo, inactivo, bloqueado]
 *         ultimo_acceso:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *       example:
 *         id: "a3b07384-d113-4956-a5b6-76472251cf99"
 *         id_rol: "d3b07384-d113-4956-a5b6-76472251cf78"
 *         nombre_rol: "ADMINISTRADOR"
 *         correo: "admin@empresa.com"
 *         estado: "activo"
 *         ultimo_acceso: "2026-08-03T08:00:00.000Z"
 *         fecha_creacion: "2026-01-01T10:00:00.000Z"
 *
 *     UsuarioInput:
 *       type: object
 *       required:
 *         - id_rol
 *         - correo
 *         - password
 *       properties:
 *         id_rol:
 *           type: string
 *           format: uuid
 *         correo:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         estado:
 *           type: string
 *           enum: [activo, inactivo, bloqueado]
 *           default: "activo"
 */

/**
 * @openapi
 * /api/v1/usuarios/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     description: Autentica credenciales y genera un token JWT.
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login exitoso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciales inválidas.
 *       403:
 *         description: Usuario inactivo o bloqueado.
 */
router.post("/login", validateRequest(loginSchema), usuarioController.login);

// Middleware para proteger las rutas de administración de usuarios
router.use(authenticate);

/**
 * @openapi
 * /api/v1/usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags:
 *       - Usuarios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioInput'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente.
 *       409:
 *         description: El correo ya está registrado.
 *
 *   get:
 *     summary: Listar usuarios
 *     tags:
 *       - Usuarios
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [activo, inactivo, bloqueado]
 *     responses:
 *       200:
 *         description: Lista de usuarios recuperada exitosamente.
 */
router.post(
  "/",
  validateRequest(createUserSchema),
  usuarioController.createUser,
);

router.get(
  "/",
  validateRequest(getUsersQuerySchema),
  usuarioController.getUsers,
);

/**
 * @openapi
 * /api/v1/usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Usuario encontrado.
 *       404:
 *         description: Usuario no encontrado.
 *
 *   put:
 *     summary: Actualizar datos de usuario
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente.
 */
router.get(
  "/:id",
  validateRequest(userIdParamSchema),
  usuarioController.getUserById,
);

router.put(
  "/:id",
  validateRequest(updateUserSchema),
  usuarioController.updateUser,
);

export default router;
