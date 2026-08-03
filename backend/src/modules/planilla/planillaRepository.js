import { query, getClient } from "../../config/db.js";
import { logger } from "../../utils/logger.js";

export const getPlanillaByMesAnio = async (mes, anio) => {
  try {
    const sql = `
      SELECT id, mes, anio, fecha_generacion, estado
      FROM public.planilla
      WHERE mes = $1 AND anio = $2;
    `;
    const result = await query(sql, [mes, anio]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, mes, anio }, "Error en getPlanillaByMesAnio");
    throw new Error("Error al consultar la planilla por mes y año");
  }
};

export const generarPlanillaCompletaTx = async ({ mes, anio }) => {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    // 1. Crear registro de planilla cabecera
    const insertPlanillaSql = `
      INSERT INTO public.planilla (mes, anio)
      VALUES ($1, $2)
      RETURNING id, mes, anio, fecha_generacion, estado;
    `;
    const planillaResult = await client.query(insertPlanillaSql, [mes, anio]);
    const nuevaPlanilla = planillaResult.rows[0];

    // 2. Obtener todos los empleados activos
    const empleadosSql = `
      SELECT id, salario_base
      FROM public.empleados
      WHERE estado = 'activo';
    `;
    const empleadosResult = await client.query(empleadosSql);
    const empleadosActivos = empleadosResult.rows;

    if (empleadosActivos.length === 0) {
      await client.query("ROLLBACK");
      throw new Error("NO_ACTIVE_EMPLOYEES");
    }

    // 3. Obtener todas las deducciones asignadas a los empleados
    const deduccionesSql = `
      SELECT
        ed.id_empleado,
        d.tipo,
        d.porcentaje,
        d.monto_fijo
      FROM public.empleado_deducciones ed
      JOIN public.deducciones d ON d.id = ed.id_deduccion;
    `;
    const deduccionesResult = await client.query(deduccionesSql);
    const deduccionesAsignadas = deduccionesResult.rows;

    // Agrupar deducciones por ID de empleado
    const deduccionesPorEmpleado = {};
    for (const ded of deduccionesAsignadas) {
      if (!deduccionesPorEmpleado[ded.id_empleado]) {
        deduccionesPorEmpleado[ded.id_empleado] = [];
      }
      deduccionesPorEmpleado[ded.id_empleado].push(ded);
    }

    // 4. Calcular y generar detalles por cada empleado
    for (const emp of empleadosActivos) {
      const salarioBase = Number(emp.salario_base);
      const listaDeducciones = deduccionesPorEmpleado[emp.id] || [];

      let totalDeducciones = 0;
      for (const d of listaDeducciones) {
        if (d.tipo === "porcentaje" && d.porcentaje !== null) {
          totalDeducciones += salarioBase * (Number(d.porcentaje) / 100);
        } else if (d.tipo === "monto_fijo" && d.monto_fijo !== null) {
          totalDeducciones += Number(d.monto_fijo);
        }
      }

      // Evitar salarios netos negativos
      totalDeducciones = Math.min(
        salarioBase,
        Math.round(totalDeducciones * 100) / 100,
      );
      const salarioNeto =
        Math.round((salarioBase - totalDeducciones) * 100) / 100;

      const insertDetalleSql = `
        INSERT INTO public.detalle_planilla (
          id_planilla, id_empleado, salario_base, total_deduccion, salario_neto
        )
        VALUES ($1, $2, $3, $4, $5);
      `;
      await client.query(insertDetalleSql, [
        nuevaPlanilla.id,
        emp.id,
        salarioBase,
        totalDeducciones,
        salarioNeto,
      ]);
    }

    await client.query("COMMIT");
    return nuevaPlanilla;
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.message === "NO_ACTIVE_EMPLOYEES") throw err;
    logger.error({ err, mes, anio }, "Error en generarPlanillaCompletaTx");
    throw new Error(
      "Error transaccional al generar la planilla y sus detalles",
    );
  } finally {
    client.release();
  }
};

export const getPlanillas = async (
  limit = 10,
  offset = 0,
  anioFilter = null,
  mesFilter = null,
  estadoFilter = null,
) => {
  try {
    const lim = Number(limit) || 10;
    const off = Number(offset) || 0;

    let sql = `
      SELECT id, mes, anio, fecha_generacion, estado,
             COUNT(*) OVER() AS total_count
      FROM public.planilla
    `;
    const params = [];
    const conditions = [];

    if (anioFilter) {
      params.push(anioFilter);
      conditions.push(`anio = $${params.length}`);
    }

    if (mesFilter) {
      params.push(mesFilter);
      conditions.push(`mes = $${params.length}`);
    }

    if (estadoFilter) {
      params.push(estadoFilter);
      conditions.push(`estado = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    params.push(lim);
    sql += ` ORDER BY anio DESC, mes DESC LIMIT $${params.length}`;

    params.push(off);
    sql += ` OFFSET $${params.length};`;

    const result = await query(sql, params);

    const total =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
    const data = result.rows.map(({ total_count, ...planilla }) => planilla);

    return { data, total };
  } catch (err) {
    logger.error(
      { err, limit, offset, anioFilter, mesFilter, estadoFilter },
      "Error en getPlanillas",
    );
    throw new Error("Error al obtener el listado de planillas");
  }
};

export const getPlanillaById = async (id) => {
  try {
    const sql = `
      SELECT id, mes, anio, fecha_generacion, estado
      FROM public.planilla
      WHERE id = $1;
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, id }, "Error en getPlanillaById");
    throw new Error("Error al consultar la planilla por ID");
  }
};

export const getDetallesByPlanillaId = async (id_planilla) => {
  try {
    const sql = `
      SELECT
        dp.id,
        dp.id_planilla,
        dp.id_empleado,
        dp.salario_base,
        dp.total_deduccion,
        dp.salario_neto,
        e.codigo_empleado,
        e.cedula,
        e.nombres,
        e.apellidos,
        c.nombre AS cargo_nombre
      FROM public.detalle_planilla dp
      JOIN public.empleados e ON e.id = dp.id_empleado
      LEFT JOIN public.cargos c ON c.id = e.id_cargo
      WHERE dp.id_planilla = $1
      ORDER BY e.nombres ASC, e.apellidos ASC;
    `;
    const result = await query(sql, [id_planilla]);
    return result.rows;
  } catch (err) {
    logger.error({ err, id_planilla }, "Error en getDetallesByPlanillaId");
    throw new Error("Error al consultar los detalles de la planilla");
  }
};

export const updatePlanillaEstado = async (id, estado) => {
  try {
    const sql = `
      UPDATE public.planilla
      SET estado = $1
      WHERE id = $2
      RETURNING id, mes, anio, fecha_generacion, estado;
    `;
    const result = await query(sql, [estado, id]);
    return result.rows[0] || null;
  } catch (err) {
    logger.error({ err, id, estado }, "Error en updatePlanillaEstado");
    throw new Error("Error al actualizar el estado de la planilla");
  }
};
