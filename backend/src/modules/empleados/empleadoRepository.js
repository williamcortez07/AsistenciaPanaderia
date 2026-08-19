import { query } from "../../config/db.js";
import { logger } from "../../utils/logger.js";

/* ==========================================================================
   CRUD PRINCIPAL: EMPLEADOS
   ========================================================================== */

export const createEmpleado = async ({
  id_cargo,
  id_usuario = null,
  id_supervisor = null,
  codigo_empleado,
  cedula,
  nombres,
  apellidos,
  telefono = null,
  direccion = null,
  fecha_contratacion,
  salario_base,
  estado = "activo",
}) => {
  try {
    const sql = `
      INSERT INTO public.empleados (
        id_cargo,
        id_usuario,
        id_supervisor,
        codigo_empleado,
        cedula,
        nombres,
        apellidos,
        telefono,
        direccion,
        fecha_contratacion,
        salario_base,
        estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING
        id, id_cargo, id_usuario, id_supervisor, codigo_empleado, cedula,
        nombres, apellidos, telefono, direccion,
        fecha_contratacion, salario_base, estado;
    `;
    const result = await query(sql, [
      id_cargo,
      id_usuario,
      id_supervisor,
      codigo_empleado,
      cedula,
      nombres,
      apellidos,
      telefono,
      direccion,
      fecha_contratacion,
      salario_base,
      estado,
    ]);
    return result.rows[0];
  } catch (err) {
    logger.error({ err, codigo_empleado, cedula }, "Error en createEmpleado");
    throw new Error("Error al crear el empleado en la base de datos");
  }
};

export const getEmpleados = async (
  limit = 10,
  offset = 0,
  searchFilter = null,
  estadoFilter = null,
) => {
  try {
    const lim = Number(limit) || 10;
    const off = Number(offset) || 0;

    let sql = `
      SELECT
        e.id, e.id_cargo, e.id_usuario, e.id_supervisor, e.codigo_empleado, e.cedula,
        e.nombres, e.apellidos, e.telefono, e.direccion,
        e.fecha_contratacion, e.salario_base, e.estado,
        c.nombre AS cargo_nombre, c.horario_entrada, c.horario_salida,
        CONCAT(sup.nombres, ' ', sup.apellidos) AS supervisor_nombre,
        COUNT(*) OVER() AS total_count
      FROM public.empleados e
      LEFT JOIN public.cargos c ON e.id_cargo = c.id
      LEFT JOIN public.empleados sup ON e.id_supervisor = sup.id
    `;
    const params = [];
    const whereConditions = [];

    if (searchFilter) {
      params.push(`%${searchFilter}%`);
      whereConditions.push(`(
        e.nombres ILIKE $${params.length} OR
        e.apellidos ILIKE $${params.length} OR
        e.cedula ILIKE $${params.length} OR
        e.codigo_empleado ILIKE $${params.length}
      )`);
    }

    if (estadoFilter) {
      params.push(estadoFilter);
      whereConditions.push(`e.estado = $${params.length}`);
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    params.push(lim);
    sql += ` ORDER BY e.nombres ASC, e.apellidos ASC LIMIT $${params.length}`;

    params.push(off);
    sql += ` OFFSET $${params.length};`;

    const result = await query(sql, params);

    const total =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
    const data = result.rows.map(({ total_count, ...empleado }) => empleado);

    return { data, total };
  } catch (err) {
    logger.error(
      { err, limit, offset, searchFilter, estadoFilter },
      "Error en getEmpleados",
    );
    throw new Error("Error al obtener los empleados desde la base de datos");
  }
};

export const getEmpleadoById = async (id) => {
  try {
    const sql = `
      SELECT
        e.id, e.id_cargo, e.id_usuario, e.id_supervisor, e.codigo_empleado, e.cedula,
        e.nombres, e.apellidos, e.telefono, e.direccion,
        e.fecha_contratacion, e.salario_base, e.estado,
        c.nombre AS cargo_nombre, c.horario_entrada, c.horario_salida,
        CONCAT(sup.nombres, ' ', sup.apellidos) AS supervisor_nombre
      FROM public.empleados e
      LEFT JOIN public.cargos c ON e.id_cargo = c.id
      LEFT JOIN public.empleados sup ON e.id_supervisor = sup.id
      WHERE e.id = $1;
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en getEmpleadoById");
    throw new Error("Error al consultar empleado por ID");
  }
};

export const getEmpleadoByCodigo = async (codigo_empleado) => {
  try {
    const sql = `
      SELECT
        e.id, e.id_cargo, e.id_usuario, e.id_supervisor, e.codigo_empleado, e.cedula,
        e.nombres, e.apellidos, e.telefono, e.direccion,
        e.fecha_contratacion, e.salario_base, e.estado,
        c.nombre AS cargo_nombre, c.horario_entrada, c.horario_salida,
        CONCAT(sup.nombres, ' ', sup.apellidos) AS supervisor_nombre
      FROM public.empleados e
      LEFT JOIN public.cargos c ON e.id_cargo = c.id
      LEFT JOIN public.empleados sup ON e.id_supervisor = sup.id
      WHERE e.codigo_empleado = $1;
    `;
    const result = await query(sql, [codigo_empleado]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, codigo_empleado }, "Error en getEmpleadoByCodigo");
    throw new Error("Error al consultar empleado por código");
  }
};

export const getEmpleadoByCedula = async (cedula) => {
  try {
    const sql = `
      SELECT
        e.id, e.id_cargo, e.id_usuario, e.id_supervisor, e.codigo_empleado, e.cedula,
        e.nombres, e.apellidos, e.telefono, e.direccion,
        e.fecha_contratacion, e.salario_base, e.estado
      FROM public.empleados e
      WHERE e.cedula = $1;
    `;
    const result = await query(sql, [cedula]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, cedula }, "Error en getEmpleadoByCedula");
    throw new Error("Error al consultar empleado por cédula");
  }
};

export const updateEmpleado = async (id, updateData) => {
  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      "id_cargo",
      "id_usuario",
      "id_supervisor",
      "codigo_empleado",
      "cedula",
      "nombres",
      "apellidos",
      "telefono",
      "direccion",
      "fecha_contratacion",
      "salario_base",
      "estado",
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
      UPDATE public.empleados
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING
        id, id_cargo, id_usuario, id_supervisor, codigo_empleado, cedula,
        nombres, apellidos, telefono, direccion,
        fecha_contratacion, salario_base, estado;
    `;

    const result = await query(sql, values);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, id, updateData }, "Error en updateEmpleado");
    throw new Error("Error al actualizar el empleado");
  }
};

/* ==========================================================================
   SUBRECURSO ANIDADO: EMPLEADO_DEDUCCIONES
   ========================================================================== */

export const assignDeduccionToEmpleado = async (id_empleado, id_deduccion) => {
  try {
    const sql = `
      INSERT INTO public.empleado_deducciones (id_empleado, id_deduccion)
      VALUES ($1, $2)
      RETURNING id_empleado, id_deduccion;
    `;
    const result = await query(sql, [id_empleado, id_deduccion]);
    return result.rows[0];
  } catch (err) {
    if (err.code === "23505") {
      throw new Error("La deducción ya se encuentra asignada a este empleado");
    }
    if (err.code === "23503") {
      throw new Error("El empleado o la deducción especificada no existe");
    }
    logger.error(
      { err, id_empleado, id_deduccion },
      "Error en assignDeduccionToEmpleado",
    );
    throw new Error("Error al asignar la deducción al empleado");
  }
};

export const getDeduccionesByEmpleadoId = async (id_empleado) => {
  try {
    const sql = `
      SELECT
        d.id AS id_deduccion,
        d.nombre,
        d.descripcion,
        d.tipo,
        d.porcentaje,
        d.monto_fijo
      FROM public.empleado_deducciones ed
      JOIN public.deducciones d ON d.id = ed.id_deduccion
      WHERE ed.id_empleado = $1
      ORDER BY d.nombre ASC;
    `;
    const result = await query(sql, [id_empleado]);
    return result.rows;
  } catch (err) {
    logger.error({ err, id_empleado }, "Error en getDeduccionesByEmpleadoId");
    throw new Error("Error al consultar las deducciones del empleado");
  }
};

export const removeDeduccionFromEmpleado = async (
  id_empleado,
  id_deduccion,
) => {
  try {
    const sql = `
      DELETE FROM public.empleado_deducciones
      WHERE id_empleado = $1 AND id_deduccion = $2
      RETURNING id_empleado, id_deduccion;
    `;
    const result = await query(sql, [id_empleado, id_deduccion]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error(
      { err, id_empleado, id_deduccion },
      "Error en removeDeduccionFromEmpleado",
    );
    throw new Error("Error al remover la deducción del empleado");
  }
};
