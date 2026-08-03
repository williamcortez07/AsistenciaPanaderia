import { query } from "../../config/db.js";
import { logger } from "../../utils/logger.js";

export const createDeduccion = async ({
  nombre,
  descripcion = null,
  tipo,
  porcentaje = null,
  monto_fijo = null,
}) => {
  try {
    const sql = `
      INSERT INTO public.deducciones (nombre, descripcion, tipo, porcentaje, monto_fijo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, descripcion, tipo, porcentaje, monto_fijo;
    `;
    const result = await query(sql, [
      nombre,
      descripcion,
      tipo,
      porcentaje,
      monto_fijo,
    ]);
    return result.rows[0];
  } catch (err) {
    logger.error({ err, nombre }, "Error en createDeduccion");
    throw new Error("Error al crear la deducción en la base de datos");
  }
};

export const getDeducciones = async (
  limit = 10,
  offset = 0,
  nameFilter = null,
  tipoFilter = null,
) => {
  try {
    const lim = Number(limit) || 10;
    const off = Number(offset) || 0;

    let sql = `
      SELECT id, nombre, descripcion, tipo, porcentaje, monto_fijo,
             COUNT(*) OVER() AS total_count
      FROM public.deducciones
    `;
    const params = [];
    const conditions = [];

    if (nameFilter) {
      params.push(`%${nameFilter}%`);
      conditions.push(`nombre ILIKE $${params.length}`);
    }

    if (tipoFilter) {
      params.push(tipoFilter);
      conditions.push(`tipo = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    params.push(lim);
    sql += ` ORDER BY nombre ASC LIMIT $${params.length}`;

    params.push(off);
    sql += ` OFFSET $${params.length};`;

    const result = await query(sql, params);

    const total =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
    const data = result.rows.map(({ total_count, ...deduccion }) => deduccion);

    return { data, total };
  } catch (err) {
    logger.error(
      { err, limit, offset, nameFilter, tipoFilter },
      "Error en getDeducciones",
    );
    throw new Error("Error al obtener las deducciones desde la base de datos");
  }
};

export const getDeduccionById = async (id) => {
  try {
    const sql = `
      SELECT id, nombre, descripcion, tipo, porcentaje, monto_fijo
      FROM public.deducciones
      WHERE id = $1;
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en getDeduccionById");
    throw new Error("Error al consultar deducción por ID");
  }
};

export const getDeduccionByName = async (nombre) => {
  try {
    const sql = `
      SELECT id, nombre, descripcion, tipo, porcentaje, monto_fijo
      FROM public.deducciones
      WHERE nombre = $1;
    `;
    const result = await query(sql, [nombre]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, nombre }, "Error en getDeduccionByName");
    throw new Error("Error al consultar deducción por nombre");
  }
};

export const updateDeduccion = async (id, updateData) => {
  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      "nombre",
      "descripcion",
      "tipo",
      "porcentaje",
      "monto_fijo",
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(updateData[field]);
        paramIndex++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const sql = `
      UPDATE public.deducciones
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, nombre, descripcion, tipo, porcentaje, monto_fijo;
    `;

    const result = await query(sql, values);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, id, updateData }, "Error en updateDeduccion");
    throw new Error("Error al actualizar la deducción");
  }
};
