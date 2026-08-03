import * as empleadoRepository from "./empleadoRepository.js";
import { AppError } from "../../utils/appError.js";

/* ==========================================================================
   SERVICIOS PRINCIPALES: EMPLEADOS
   ========================================================================== */

export const createEmpleadoService = async (empleadoData) => {
  const {
    id_cargo,
    id_usuario,
    codigo_empleado,
    cedula,
    nombres,
    apellidos,
    telefono,
    direccion,
    fecha_contratacion,
    salario_base,
    estado = "activo",
  } = empleadoData ?? {};

  if (!id_cargo) {
    throw new AppError("El campo 'id_cargo' es requerido", 400);
  }

  if (
    !codigo_empleado ||
    typeof codigo_empleado !== "string" ||
    !codigo_empleado.trim()
  ) {
    throw new AppError("El campo 'codigo_empleado' es requerido", 400);
  }

  if (!cedula || typeof cedula !== "string" || !cedula.trim()) {
    throw new AppError("El campo 'cedula' es requerido", 400);
  }

  if (!nombres || typeof nombres !== "string" || nombres.trim().length < 2) {
    throw new AppError(
      "El campo 'nombres' es requerido y debe tener al menos 2 caracteres",
      400,
    );
  }

  if (
    !apellidos ||
    typeof apellidos !== "string" ||
    apellidos.trim().length < 2
  ) {
    throw new AppError(
      "El campo 'apellidos' es requerido y debe tener al menos 2 caracteres",
      400,
    );
  }

  if (!fecha_contratacion) {
    throw new AppError("El campo 'fecha_contratacion' es requerido", 400);
  }

  if (salario_base === undefined || Number(salario_base) < 0) {
    throw new AppError(
      "El campo 'salario_base' es requerido y debe ser un número mayor o igual a 0",
      400,
    );
  }

  const existingCodigo = await empleadoRepository.getEmpleadoByCodigo(
    codigo_empleado.trim(),
  );
  if (existingCodigo) {
    throw new AppError(
      `El código de empleado '${codigo_empleado}' ya existe`,
      409,
    );
  }

  const existingCedula = await empleadoRepository.getEmpleadoByCedula(
    cedula.trim(),
  );
  if (existingCedula) {
    throw new AppError(`La cédula '${cedula}' ya está registrada`, 409);
  }

  const newEmpleado = await empleadoRepository.createEmpleado({
    id_cargo,
    id_usuario: id_usuario ?? null,
    codigo_empleado: codigo_empleado.trim(),
    cedula: cedula.trim(),
    nombres: nombres.trim(),
    apellidos: apellidos.trim(),
    telefono: telefono ? telefono.trim() : null,
    direccion: direccion ? direccion.trim() : null,
    fecha_contratacion,
    salario_base: Number(salario_base),
    estado,
  });

  return newEmpleado;
};

export const getEmpleadosService = async ({
  page = 1,
  limit = 10,
  search,
  estado,
} = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
  const offset = (pageNum - 1) * limitNum;

  const { data, total } = await empleadoRepository.getEmpleados(
    limitNum,
    offset,
    search,
    estado,
  );

  return {
    data,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

export const getEmpleadoByIdService = async (id) => {
  const empleado = await empleadoRepository.getEmpleadoById(id);
  if (!empleado) {
    throw new AppError("Empleado no encontrado", 404);
  }
  return empleado;
};

export const getEmpleadoByCodigoService = async (codigo) => {
  if (!codigo || typeof codigo !== "string") {
    throw new AppError("El parámetro 'codigo' es requerido", 400);
  }

  const empleado = await empleadoRepository.getEmpleadoByCodigo(codigo.trim());
  if (!empleado) {
    throw new AppError("Empleado no encontrado", 404);
  }
  return empleado;
};

export const updateEmpleadoService = async (id, updateData) => {
  if (!updateData || Object.keys(updateData).length === 0) {
    throw new AppError("Debes enviar al menos un campo para actualizar", 400);
  }

  const existingEmpleado = await empleadoRepository.getEmpleadoById(id);
  if (!existingEmpleado) {
    throw new AppError("Empleado no encontrado", 404);
  }

  const formattedData = {};

  if (updateData.id_cargo !== undefined)
    formattedData.id_cargo = updateData.id_cargo;
  if (updateData.id_usuario !== undefined)
    formattedData.id_usuario = updateData.id_usuario;

  if (updateData.codigo_empleado !== undefined) {
    const cleanCodigo = updateData.codigo_empleado.trim();
    if (cleanCodigo !== existingEmpleado.codigo_empleado) {
      const codeExists =
        await empleadoRepository.getEmpleadoByCodigo(cleanCodigo);
      if (codeExists) {
        throw new AppError(
          `El código de empleado '${cleanCodigo}' ya está registrado`,
          409,
        );
      }
    }
    formattedData.codigo_empleado = cleanCodigo;
  }

  if (updateData.cedula !== undefined) {
    const cleanCedula = updateData.cedula.trim();
    if (cleanCedula !== existingEmpleado.cedula) {
      const cedulaExists =
        await empleadoRepository.getEmpleadoByCedula(cleanCedula);
      if (cedulaExists) {
        throw new AppError(
          `La cédula '${cleanCedula}' ya está registrada`,
          409,
        );
      }
    }
    formattedData.cedula = cleanCedula;
  }

  if (updateData.nombres !== undefined)
    formattedData.nombres = updateData.nombres.trim();
  if (updateData.apellidos !== undefined)
    formattedData.apellidos = updateData.apellidos.trim();
  if (updateData.telefono !== undefined)
    formattedData.telefono = updateData.telefono
      ? updateData.telefono.trim()
      : null;
  if (updateData.direccion !== undefined)
    formattedData.direccion = updateData.direccion
      ? updateData.direccion.trim()
      : null;
  if (updateData.fecha_contratacion !== undefined)
    formattedData.fecha_contratacion = updateData.fecha_contratacion;
  if (updateData.salario_base !== undefined)
    formattedData.salario_base = Number(updateData.salario_base);
  if (updateData.estado !== undefined) formattedData.estado = updateData.estado;

  const updatedEmpleado = await empleadoRepository.updateEmpleado(
    id,
    formattedData,
  );
  return updatedEmpleado;
};

/* ==========================================================================
   SERVICIOS SUBRECURSO: EMPLEADO_DEDUCCIONES
   ========================================================================== */

export const assignDeduccionToEmpleadoService = async (
  id_empleado,
  id_deduccion,
) => {
  const empleado = await empleadoRepository.getEmpleadoById(id_empleado);
  if (!empleado) {
    throw new AppError("Empleado no encontrado", 404);
  }

  try {
    const result = await empleadoRepository.assignDeduccionToEmpleado(
      id_empleado,
      id_deduccion,
    );
    return result;
  } catch (err) {
    if (err.message.includes("ya se encuentra asignada")) {
      throw new AppError(err.message, 409);
    }
    if (err.message.includes("no existe")) {
      throw new AppError(err.message, 404);
    }
    throw err;
  }
};

export const getDeduccionesByEmpleadoIdService = async (id_empleado) => {
  const empleado = await empleadoRepository.getEmpleadoById(id_empleado);
  if (!empleado) {
    throw new AppError("Empleado no encontrado", 404);
  }

  const deducciones =
    await empleadoRepository.getDeduccionesByEmpleadoId(id_empleado);
  return deducciones;
};

export const removeDeduccionFromEmpleadoService = async (
  id_empleado,
  id_deduccion,
) => {
  const empleado = await empleadoRepository.getEmpleadoById(id_empleado);
  if (!empleado) {
    throw new AppError("Empleado no encontrado", 404);
  }

  const removed = await empleadoRepository.removeDeduccionFromEmpleado(
    id_empleado,
    id_deduccion,
  );

  if (!removed) {
    throw new AppError(
      "La deducción especificada no está asignada a este empleado",
      404,
    );
  }

  return { message: "Deducción removida del empleado exitosamente" };
};
