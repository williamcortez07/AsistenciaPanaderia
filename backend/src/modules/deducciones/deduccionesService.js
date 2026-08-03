import * as deduccionRepository from "./deduccionesRepository.js";
import { AppError } from "../../utils/appError.js";

export const createDeduccionService = async (deduccionData) => {
  const { nombre, descripcion, tipo, porcentaje, monto_fijo } =
    deduccionData ?? {};

  const cleanNombre = nombre?.trim();

  if (
    !cleanNombre ||
    typeof cleanNombre !== "string" ||
    cleanNombre.length < 2
  ) {
    throw new AppError(
      "El campo 'nombre' es requerido y debe tener al menos 2 caracteres",
      400,
    );
  }

  const existingDeduccion =
    await deduccionRepository.getDeduccionByName(cleanNombre);
  if (existingDeduccion) {
    throw new AppError(
      `La deducción con el nombre '${cleanNombre}' ya existe`,
      409,
    );
  }

  // Regla de Negocio / Check Constraint
  let finalPorcentaje = null;
  let finalMontoFijo = null;

  if (tipo === "porcentaje") {
    if (porcentaje === undefined || porcentaje === null) {
      throw new AppError(
        "Debes especificar el 'porcentaje' para tipo 'porcentaje'",
        400,
      );
    }
    finalPorcentaje = Number(porcentaje);
  } else if (tipo === "monto_fijo") {
    if (monto_fijo === undefined || monto_fijo === null) {
      throw new AppError(
        "Debes especificar el 'monto_fijo' para tipo 'monto_fijo'",
        400,
      );
    }
    finalMontoFijo = Number(monto_fijo);
  } else {
    throw new AppError(
      "El campo 'tipo' debe ser 'porcentaje' o 'monto_fijo'",
      400,
    );
  }

  const newDeduccion = await deduccionRepository.createDeduccion({
    nombre: cleanNombre,
    descripcion: descripcion ? descripcion.trim() : null,
    tipo,
    porcentaje: finalPorcentaje,
    monto_fijo: finalMontoFijo,
  });

  return newDeduccion;
};

export const getDeduccionesService = async ({
  page = 1,
  limit = 10,
  name,
  tipo,
} = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
  const offset = (pageNum - 1) * limitNum;

  const { data, total } = await deduccionRepository.getDeducciones(
    limitNum,
    offset,
    name,
    tipo,
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

export const getDeduccionByIdService = async (id) => {
  const deduccion = await deduccionRepository.getDeduccionById(id);
  if (!deduccion) {
    throw new AppError("Deducción no encontrada", 404);
  }
  return deduccion;
};

export const getDeduccionByNameService = async (nombre) => {
  if (!nombre || typeof nombre !== "string") {
    throw new AppError("El parámetro 'nombre' es requerido", 400);
  }

  const deduccion = await deduccionRepository.getDeduccionByName(nombre.trim());
  if (!deduccion) {
    throw new AppError("Deducción no encontrada", 404);
  }
  return deduccion;
};

export const updateDeduccionService = async (id, updateData) => {
  if (!updateData || Object.keys(updateData).length === 0) {
    throw new AppError("Debes enviar al menos un campo para actualizar", 400);
  }

  const existingDeduccion = await deduccionRepository.getDeduccionById(id);
  if (!existingDeduccion) {
    throw new AppError("Deducción no encontrada", 404);
  }

  const repositoryData = {};

  if (updateData.nombre !== undefined) {
    const cleanNombre = updateData.nombre.trim();
    if (cleanNombre !== existingDeduccion.nombre) {
      const deduccionWithSameName =
        await deduccionRepository.getDeduccionByName(cleanNombre);
      if (deduccionWithSameName) {
        throw new AppError(
          `El nombre de deducción '${cleanNombre}' ya está en uso`,
          409,
        );
      }
    }
    repositoryData.nombre = cleanNombre;
  }

  if (updateData.descripcion !== undefined) {
    repositoryData.descripcion = updateData.descripcion
      ? updateData.descripcion.trim()
      : null;
  }

  const targetTipo = updateData.tipo || existingDeduccion.tipo;

  if (targetTipo === "porcentaje") {
    repositoryData.tipo = "porcentaje";
    repositoryData.monto_fijo = null;
    if (updateData.porcentaje !== undefined) {
      repositoryData.porcentaje = Number(updateData.porcentaje);
    } else if (existingDeduccion.porcentaje === null) {
      throw new AppError("Debes proporcionar un 'porcentaje' válido", 400);
    }
  } else if (targetTipo === "monto_fijo") {
    repositoryData.tipo = "monto_fijo";
    repositoryData.porcentaje = null;
    if (updateData.monto_fijo !== undefined) {
      repositoryData.monto_fijo = Number(updateData.monto_fijo);
    } else if (existingDeduccion.monto_fijo === null) {
      throw new AppError("Debes proporcionar un 'monto_fijo' válido", 400);
    }
  }

  const updatedDeduccion = await deduccionRepository.updateDeduccion(
    id,
    repositoryData,
  );
  return updatedDeduccion;
};
