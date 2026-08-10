import { query } from "../../config/db.js";
import { logger } from "../../utils/logger.js";

/**
 * Busca un usuario por correo para autenticación.
 * Incluye password_hash y datos de rol.
 *
 * @param {string} correo
 * @returns {Promise<{ id: string, correo: string, password_hash: string, estado: string, id_rol: string, nombre_rol: string }|null>}
 */
export const findUserByCorreoForAuth = async (correo) => {
  try {
    const sql = `
      SELECT
        u.id, u.correo, u.password_hash, u.estado, u.id_rol, r.nombre AS nombre_rol,
        e.id AS id_empleado, e.nombres AS emp_nombres, e.apellidos AS emp_apellidos,
        e.codigo_empleado
      FROM public.usuarios u
      JOIN public.roles r ON r.id = u.id_rol
      LEFT JOIN public.empleados e ON e.id_usuario = u.id
      WHERE u.correo = $1;
    `;
    const result = await query(sql, [correo]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, correo }, "Error en findUserByCorreoForAuth");
    throw new Error("Error al consultar el usuario por correo");
  }
};

/**
 * Busca un usuario por ID para renovación de tokens (refresh).
 *
 * @param {string} id UUID del usuario
 * @returns {Promise<{ id: string, correo: string, estado: string, id_rol: string, nombre_rol: string }|null>}
 */
export const findUserByIdForAuth = async (id) => {
  try {
    const sql = `
      SELECT u.id, u.correo, u.estado, u.id_rol, r.nombre AS nombre_rol
      FROM public.usuarios u
      JOIN public.roles r ON r.id = u.id_rol
      WHERE u.id = $1;
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en findUserByIdForAuth");
    throw new Error("Error al consultar el usuario por ID");
  }
};

/**
 * Actualiza el último acceso del usuario.
 *
 * @param {string} id UUID del usuario
 */
export const updateLastLogin = async (id) => {
  try {
    await query(
      `UPDATE public.usuarios SET ultimo_acceso = NOW() WHERE id = $1;`,
      [id],
    );
  } catch (err) {
    logger.warn({ err, id }, "No se pudo actualizar ultimo_acceso");
  }
};
