import { query } from "../../config/db.js";
import { logger } from "../../utils/logger.js";

export const createVacacion = async ({
  id_empleado,
  fecha_inicio,
  fecha_fin,
  dias,
  motivo = null,
}) => {
  try {
    const sql = `
      INSERT INTO public.vacaciones (id_empleado, fecha_inicio, fecha_fin, dias, motivo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, id_empleado, fecha_inicio, fecha_fin, dias, motivo, fecha_solicitud;
    `;
    const result = await query(sql, [
      id_empleado,
      fecha_inicio,
      fecha_fin,
      dias,
      motivo,
    ]);
    return result.rows[0];
  } catch (err) {
    logger.error({ err, id_empleado }, "Error en createVacacion");
    throw new Error(
      "Error al registrar la solicitud de vacaciones en la base de datos",
    );
  }
};

export const getVacaciones = async ({
  limit = 10,
  offset = 0,
  id_empleado = null,
  fecha_desde = null,
  fecha_hasta = null,
}) => {
  try {
    const lim = Number(limit) || 10;
    const off = Number(offset) || 0;

    let sql = `
      SELECT
        v.id, v.id_empleado, v.fecha_inicio, v.fecha_fin, v.dias, v.motivo, v.fecha_solicitud,
        e.codigo_empleado, e.cedula, e.nombres, e.apellidos,
        c.nombre AS cargo_nombre,
        COUNT(*) OVER() AS total_count
      FROM public.vacaciones v
      JOIN public.empleados e ON e.id = v.id_empleado
      LEFT JOIN public.cargos c ON c.id = e.id_cargo
    `;
    const params = [];
    const conditions = [];

    if (id_empleado) {
      params.push(id_empleado);
      conditions.push(`v.id_empleado = $${params.length}`);
    }

    if (fecha_desde) {
      params.push(fecha_desde);
      conditions.push(`v.fecha_inicio >= $${params.length}`);
    }

    if (fecha_hasta) {
      params.push(fecha_hasta);
      conditions.push(`v.fecha_fin <= $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    params.push(lim);
    sql += ` ORDER BY v.fecha_solicitud DESC LIMIT $${params.length}`;

    params.push(off);
    sql += ` OFFSET $${params.length};`;

    const result = await query(sql, params);

    const total =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
    const data = result.rows.map(({ total_count, ...vacacion }) => vacacion);

    return { data, total };
  } catch (err) {
    logger.error(
      { err, limit, offset, id_empleado, fecha_desde, fecha_hasta },
      "Error en getVacaciones",
    );
    throw new Error("Error al consultar el historial de vacaciones");
  }
};

export const getVacacionById = async (id) => {
  try {
    const sql = `
      SELECT
        v.id, v.id_empleado, v.fecha_inicio, v.fecha_fin, v.dias, v.motivo, v.fecha_solicitud,
        e.codigo_empleado, e.cedula, e.nombres, e.apellidos,
        c.nombre AS cargo_nombre
      FROM public.vacaciones v
      JOIN public.empleados e ON e.id = v.id_empleado
      LEFT JOIN public.cargos c ON c.id = e.id_cargo
      WHERE v.id = $1;
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en getVacacionById");
    throw new Error("Error al consultar solicitud de vacación por ID");
  }
};

export const updateVacacion = async (id, updateData) => {
  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ["fecha_inicio", "fecha_fin", "dias", "motivo"];

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
      UPDATE public.vacaciones
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, id_empleado, fecha_inicio, fecha_fin, dias, motivo, fecha_solicitud;
    `;

    const result = await query(sql, values);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, id, updateData }, "Error en updateVacacion");
    throw new Error("Error al actualizar el registro de vacaciones");
  }
};
