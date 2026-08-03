import { query } from "../../config/db.js";
import { logger } from "../../utils/logger.js";
import { AppError } from "../../utils/appError.js";

const userColumns = [
  "u.id",
  "u.id_rol",
  "r.nombre AS nombre_rol",
  "u.correo",
  "u.estado",
  "u.ultimo_acceso",
  "u.fecha_creacion",
].join(", ");

const mapUserRow = (row) => ({
  id: row.id,
  id_rol: row.id_rol,
  nombre_rol: row.nombre_rol,
  correo: row.correo,
  estado: row.estado,
  ultimo_acceso: row.ultimo_acceso,
  fecha_creacion: row.fecha_creacion,
});

export const createUser = async ({
  id_rol,
  correo,
  password_hash,
  estado = "activo",
}) => {
  try {
    const sql = `
      INSERT INTO public.usuarios (id_rol, correo, password_hash, estado)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;

    const result = await query(sql, [id_rol, correo, password_hash, estado]);
    const newId = result.rows[0].id;
    return await getUserById(newId);
  } catch (err) {
    if (err.code === "23505") {
      logger.warn({ correo }, "Intento de registro con correo duplicado");
      throw new AppError("El correo electrónico ya está registrado", 409);
    }
    if (err.code === "23503") {
      logger.warn({ id_rol }, "FK violation al crear usuario");
      throw new AppError("El rol especificado no existe", 400);
    }
    if (err instanceof AppError) throw err;
    logger.error({ err, id_rol, correo }, "Error inesperado en createUser");
    throw new Error("Error al registrar al usuario en la base de datos");
  }
};

export const getUsers = async ({
  limit = 10,
  offset = 0,
  search = null,
  estado = null,
  id_rol = null,
}) => {
  try {
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`u.correo ILIKE $${params.length}`);
    }

    if (estado) {
      params.push(estado);
      conditions.push(`u.estado = $${params.length}`);
    }

    if (id_rol) {
      params.push(id_rol);
      conditions.push(`u.id_rol = $${params.length}`);
    }

    let sql = `
      SELECT ${userColumns}, COUNT(*) OVER() AS total_count
      FROM public.usuarios u
      JOIN public.roles r ON r.id = u.id_rol
    `;

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    params.push(limit);
    sql += ` ORDER BY u.fecha_creacion DESC LIMIT $${params.length}`;

    params.push(offset);
    sql += ` OFFSET $${params.length};`;

    const result = await query(sql, params);
    const total =
      result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;
    const data = result.rows.map(({ total_count, ...row }) => mapUserRow(row));

    return { data, total };
  } catch (err) {
    logger.error({ err, limit, offset, search, estado }, "Error en getUsers");
    throw new Error("Error al obtener usuarios desde la base de datos");
  }
};

export const getUserById = async (id) => {
  try {
    const sql = `
      SELECT ${userColumns}
      FROM public.usuarios u
      JOIN public.roles r ON r.id = u.id_rol
      WHERE u.id = $1;
    `;
    const result = await query(sql, [id]);
    return result.rows[0] ? mapUserRow(result.rows[0]) : null;
  } catch (err) {
    logger.error({ err, id }, "Error en getUserById");
    throw new Error("Error al consultar al usuario por ID");
  }
};

export const getUserForAuth = async (correo) => {
  try {
    const sql = `
      SELECT u.id, u.correo, u.password_hash, u.estado, u.id_rol, r.nombre AS nombre_rol
      FROM public.usuarios u
      JOIN public.roles r ON r.id = u.id_rol
      WHERE u.correo = $1;
    `;
    const result = await query(sql, [correo]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, correo }, "Error en getUserForAuth");
    throw new Error("Error al consultar credenciales del usuario");
  }
};

export const getUserForAuthById = async (id) => {
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
    logger.error({ err, id }, "Error en getUserForAuthById");
    throw new Error("Error al consultar credenciales del usuario por ID");
  }
};

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

export const updateUser = async (id, updateData) => {
  try {
    const fields = [];
    const values = [];
    let index = 1;

    const allowedFields = ["id_rol", "correo", "password_hash", "estado"];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = $${index}`);
        values.push(updateData[field]);
        index++;
      }
    }

    if (fields.length === 0) {
      return await getUserById(id);
    }

    values.push(id);
    const sql = `
      UPDATE public.usuarios
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING id;
    `;
    await query(sql, values);
    return await getUserById(id);
  } catch (err) {
    if (err.code === "23505") {
      throw new AppError(
        "El correo electrónico ya está registrado por otro usuario",
        409,
      );
    }
    logger.error({ err, id, updateData }, "Error en updateUser");
    throw new Error("Error al actualizar el usuario");
  }
};
