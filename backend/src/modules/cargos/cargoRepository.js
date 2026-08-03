import { query } from "../../config/db.js";
import { logger } from "../../utils/logger.js";

export const createCargo = async (
  nombre,
  descripcion = null,
  horario_entrada = null,
  horario_salida = null,
) => {
  try {
    const sql = `
      INSERT INTO public.cargos (nombre, descripcion, horario_entrada, horario_salida)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nombre AS name, descripcion AS description, horario_entrada, horario_salida;
    `;
    const result = await query(sql, [
      nombre,
      descripcion,
      horario_entrada,
      horario_salida,
    ]);
    return result.rows[0];
  } catch (err) {
    logger.error({ err, nombre }, "Error en createCargo");
    throw new Error("Error al crear el cargo en la base de datos");
  }
};

export const getCargos = async (limit = 10, offset = 0, nameFilter = null) => {
  try {
    const lim = Number(limit) || 10;
    const off = Number(offset) || 0;

    let sql = `
      SELECT id, nombre AS name, descripcion AS description, horario_entrada, horario_salida,
             COUNT(*) OVER() AS total_count
      FROM public.cargos
    `;
    const params = [];

    if (nameFilter) {
      params.push(`%${nameFilter}%`);
      sql += ` WHERE nombre ILIKE $${params.length}`;
    }

    params.push(lim);
    sql += ` ORDER BY nombre ASC LIMIT $${params.length}`;

    params.push(off);
    sql += ` OFFSET $${params.length};`;

    const result = await query(sql, params);

    const total =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
    const data = result.rows.map(({ total_count, ...cargo }) => cargo);

    return { data, total };
  } catch (err) {
    logger.error({ err, limit, offset, nameFilter }, "Error en getCargos");
    throw new Error("Error al obtener los cargos desde la base de datos");
  }
};

export const getCargoById = async (id) => {
  try {
    const sql = `
      SELECT id, nombre AS name, descripcion AS description, horario_entrada, horario_salida
      FROM public.cargos
      WHERE id = $1;
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en getCargoById");
    throw new Error("Error al consultar cargo por id");
  }
};

export const getCargoByName = async (nombre) => {
  try {
    const sql = `
      SELECT id, nombre AS name, descripcion AS description, horario_entrada, horario_salida
      FROM public.cargos
      WHERE nombre = $1;
    `;
    const result = await query(sql, [nombre]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, nombre }, "Error en getCargoByName");
    throw new Error("Error al consultar cargo por nombre");
  }
};

export const updateCargo = async (id, updateData) => {
  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updateData.nombre !== undefined) {
      fields.push(`nombre = $${paramIndex}`);
      values.push(updateData.nombre);
      paramIndex++;
    }

    if (updateData.descripcion !== undefined) {
      fields.push(`descripcion = $${paramIndex}`);
      values.push(updateData.descripcion);
      paramIndex++;
    }

    if (updateData.horario_entrada !== undefined) {
      fields.push(`horario_entrada = $${paramIndex}`);
      values.push(updateData.horario_entrada);
      paramIndex++;
    }

    if (updateData.horario_salida !== undefined) {
      fields.push(`horario_salida = $${paramIndex}`);
      values.push(updateData.horario_salida);
      paramIndex++;
    }

    if (fields.length === 0) return null;

    values.push(id);
    const sql = `
      UPDATE public.cargos
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, nombre AS name, descripcion AS description, horario_entrada, horario_salida;
    `;

    const result = await query(sql, values);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, id, updateData }, "Error en updateCargo");
    throw new Error("Error al actualizar el cargo");
  }
};
