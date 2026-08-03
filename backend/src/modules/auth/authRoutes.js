import { Router } from "express";
import * as authController from "./authController.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import { loginSchema, refreshSchema } from "./authSchema.js";

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
 *           description: Correo electrónico del usuario.
 *           example: "admin@panaderia.com"
 *         password:
 *           type: string
 *           description: Contraseña del usuario.
 *           example: "MiContrasena123"
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
 *             accessToken:
 *               type: string
 *               description: JWT de acceso (24h de validez).
 *             refreshToken:
 *               type: string
 *               description: JWT de renovación (7 días de validez).
 *             expiresIn:
 *               type: string
 *               example: "24h"
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 correo:
 *                   type: string
 *                 id_rol:
 *                   type: string
 *                   format: uuid
 *                 nombre_rol:
 *                   type: string
 *                 estado:
 *                   type: string
 *
 *     RefreshInput:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Refresh token obtenido en el login.
 *
 *     MeResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             correo:
 *               type: string
 *             id_rol:
 *               type: string
 *               format: uuid
 *             nombre_rol:
 *               type: string
 */

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: >-
 *       Autentica al usuario con correo y contraseña.
 *       Devuelve un access token (JWT, 24h) y un refresh token (JWT, 7d).
 *       La cuenta debe estar en estado "activo" para poder iniciar sesión.
 *     tags:
 *       - Autenticación
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Error de validación.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Credenciales inválidas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: La cuenta no está activa.
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
router.post("/login", validateRequest(loginSchema), authController.login);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Renovar access token
 *     description: >-
 *       Genera un nuevo access token a partir de un refresh token válido.
 *     tags:
 *       - Autenticación
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshInput'
 *     responses:
 *       200:
 *         description: Nuevo access token generado exitosamente.
 *       400:
 *         description: El refreshToken no fue enviado.
 *       401:
 *         description: Refresh token inválido o expirado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post(
  "/refresh",
  validateRequest(refreshSchema),
  authController.refreshToken,
);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: >-
 *       Cierra la sesión del usuario. Implementación stateless:
 *       el servidor indica al cliente que descarte los tokens.
 *     tags:
 *       - Autenticación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente.
 *       401:
 *         description: No autenticado.
 */
router.post("/logout", authenticate, authController.logout);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     description: >-
 *       Devuelve los datos del usuario autenticado extraídos del JWT.
 *     tags:
 *       - Autenticación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeResponse'
 *       401:
 *         description: No autenticado o token inválido.
 */
router.get("/me", authenticate, authController.getMe);

export default router;
