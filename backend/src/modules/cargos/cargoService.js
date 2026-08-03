import * as cargoRepository from "./cargoRepository.js";
import { AppError } from "../../utils/appError.js";

export const createCargoService = async (cargoData) => {
  const { name, description, horario_entrada, horario_salida } =
    cargoData ?? {};

  const nombre = name?.trim();

  if (!nombre || typeof nombre !== "string" || nombre.length < 2) {
    throw new AppError(
      "El campo 'name' es requerido y debe tener al menos 2 caracteres",
      400,
    );
  }

  const existingCargo = await cargoRepository.getCargoByName(nombre);
  if (existingCargo) {
    throw new AppError(`El cargo con el nombre '${nombre}' ya existe`, 409);
  }

  const newCargo = await cargoRepository.createCargo(
    nombre,
    description?.trim() ?? null,
    horario_entrada ?? null,
    horario_salida ?? null,
  );

  return newCargo;
};

export const getCargosService = async ({ page = 1, limit = 10, name } = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
  const offset = (pageNum - 1) * limitNum;

  const { data, total } = await cargoRepository.getCargos(
    limitNum,
    offset,
    name,
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

export const getCargoByIdService = async (id) => {
  const cargo = await cargoRepository.getCargoById(id);
  if (!cargo) {
    throw new AppError("Cargo no encontrado", 404);
  }
  return cargo;
};

export const getCargoByNameService = async (nombre) => {
  if (!nombre || typeof nombre !== "string") {
    throw new AppError("El parámetro 'nombre' es requerido", 400);
  }

  const cargo = await cargoRepository.getCargoByName(nombre.trim());
  if (!cargo) {
    throw new AppError("Cargo no encontrado", 404);
  }
  return cargo;
};

export const updateCargoService = async (id, updateData) => {
  const { name, description, horario_entrada, horario_salida } =
    updateData ?? {};

  if (
    name === undefined &&
    description === undefined &&
    horario_entrada === undefined &&
    horario_salida === undefined
  ) {
    throw new AppError("Debes enviar al menos un campo para actualizar", 400);
  }

  const repositoryData = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2) {
      throw new AppError(
        "El campo 'name' debe tener al menos 2 caracteres",
        400,
      );
    }
    repositoryData.nombre = name.trim();
  }

  if (description !== undefined) {
    repositoryData.descripcion = description ? description.trim() : null;
  }

  if (horario_entrada !== undefined) {
    repositoryData.horario_entrada = horario_entrada;
  }

  if (horario_salida !== undefined) {
    repositoryData.horario_salida = horario_salida;
  }

  const existingCargo = await cargoRepository.getCargoById(id);
  if (!existingCargo) {
    throw new AppError("Cargo no encontrado", 404);
  }

  if (repositoryData.nombre && repositoryData.nombre !== existingCargo.name) {
    const cargoWithSameName = await cargoRepository.getCargoByName(
      repositoryData.nombre,
    );
    if (cargoWithSameName) {
      throw new AppError(
        `El nombre de cargo '${repositoryData.nombre}' ya está en uso por otro cargo`,
        409,
      );
    }
  }

  const updatedCargo = await cargoRepository.updateCargo(id, repositoryData);
  return updatedCargo;
};
