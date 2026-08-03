import { query } from "../../config/db.js";
import { logger } from "../../utils/logger.js";

export const createCheckIn = async ({
  id_empleado,
  fecha,
  hora_entrada,
  estado = "presente",
  observacion = null,
}) => {
  try {
    const sql = `
      INSERT INTO public.asistencia (id_empleado, fecha, hora_entrada, estado, observacion)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, id_empleado, fecha, hora_entrada, hora_salida, estado, observacion;
    `;
    const result = await query(sql, [
      id_empleado,
      fecha,
      hora_entrada,
      estado,
      observacion,
    ]);
    return result.rows[0];
  } catch (err) {
    if (err.code === "23505") {
      throw err; // El service maneja la colisión (UNIQUE id_empleado, fecha)
    }
    logger.error({ err, id_empleado, fecha }, "Error en createCheckIn");
    throw new Error(
      "Error al registrar la entrada del empleado en la base de datos",
    );
  }
};

export const updateCheckOut = async ({
  id,
  hora_salida,
  observacion = null,
}) => {
  try {
    const sql = `
      UPDATE public.asistencia
      SET hora_salida = $1,
          observacion = CASE
            WHEN $2::text IS NOT NULL THEN COALESCE(observacion || ' | ', '') || $2::text
            ELSE observacion
          END
      WHERE id = $3
      RETURNING id, id_empleado, fecha, hora_entrada, hora_salida, estado, observacion;
    `;
    const result = await query(sql, [hora_salida, observacion, id]);
    return result.rows[0];
  } catch (err) {
    logger.error({ err, id }, "Error en updateCheckOut");
    throw new Error(
      "Error al registrar la salida del empleado en la base de datos",
    );
  }
};

export const getAsistenciaByEmpleadoAndFecha = async (id_empleado, fecha) => {
  try {
    const sql = `
      SELECT id, id_empleado, fecha, hora_entrada, hora_salida, estado, observacion
      FROM public.asistencia
      WHERE id_empleado = $1 AND fecha = $2;
    `;
    const result = await query(sql, [id_empleado, fecha]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error(
      { err, id_empleado, fecha },
      "Error en getAsistenciaByEmpleadoAndFecha",
    );
    throw new Error("Error al consultar asistencia del día");
  }
};

export const getAsistencias = async ({
  limit = 10,
  offset = 0,
  id_empleado = null,
  fecha_desde = null,
  fecha_hasta = null,
  estado = null,
}) => {
  try {
    const lim = Number(limit) || 10;
    const off = Number(offset) || 0;

    let sql = `
      SELECT
        a.id, a.id_empleado, a.fecha, a.hora_entrada, a.hora_salida, a.estado, a.observacion,
        e.codigo_empleado, e.cedula, e.nombres, e.apellidos,
        c.nombre AS cargo_nombre, c.horario_entrada AS horario_esperado_entrada, c.horario_salida AS horario_esperado_salida,
        COUNT(*) OVER() AS total_count
      FROM public.asistencia a
      JOIN public.empleados e ON e.id = a.id_empleado
      LEFT JOIN public.cargos c ON c.id = e.id_cargo
    `;
    const params = [];
    const conditions = [];

    if (id_empleado) {
      params.push(id_empleado);
      conditions.push(`a.id_empleado = $${params.length}`);
    }

    if (fecha_desde) {
      params.push(fecha_desde);
      conditions.push(`a.fecha >= $${params.length}`);
    }

    if (fecha_hasta) {
      params.push(fecha_hasta);
      conditions.push(`a.fecha <= $${params.length}`);
    }

    if (estado) {
      params.push(estado);
      conditions.push(`a.estado = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    params.push(lim);
    sql += ` ORDER BY a.fecha DESC, a.hora_entrada DESC LIMIT $${params.length}`;

    params.push(off);
    sql += ` OFFSET $${params.length};`;

    const result = await query(sql, params);

    const total =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
    const data = result.rows.map(
      ({ total_count, ...asistencia }) => asistencia,
    );

    return { data, total };
  } catch (err) {
    logger.error(
      { err, limit, offset, id_empleado, fecha_desde, fecha_hasta, estado },
      "Error en getAsistencias",
    );
    throw new Error("Error al consultar las asistencias");
  }
};

export const getAsistenciaById = async (id) => {
  try {
    const sql = `
      SELECT
        a.id, a.id_empleado, a.fecha, a.hora_entrada, a.hora_salida, a.estado, a.observacion,
        e.codigo_empleado, e.cedula, e.nombres, e.apellidos,
        c.nombre AS cargo_nombre
      FROM public.asistencia a
      JOIN public.empleados e ON e.id = a.id_empleado
      LEFT JOIN public.cargos c ON c.id = e.id_cargo
      WHERE a.id = $1;
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en getAsistenciaById");
    throw new Error("Error al consultar asistencia por ID");
  }
};

export const updateAsistencia = async (id, updateData) => {
  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      "fecha",
      "hora_entrada",
      "hora_salida",
      "estado",
      "observacion",
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
      UPDATE public.asistencia
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, id_empleado, fecha, hora_entrada, hora_salida, estado, observacion;
    `;

    const result = await query(sql, values);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, id, updateData }, "Error en updateAsistencia");
    throw new Error("Error al actualizar la asistencia");
  }
};
