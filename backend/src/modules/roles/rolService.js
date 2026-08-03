import * as roleRepository from "./rolRepository.js";
import { AppError } from "../../utils/appError.js";

export const createRoleService = async (roleData) => {
  const { name, description } = roleData ?? {};

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    throw new AppError("El campo 'name' es requerido y debe tener al menos 2 caracteres", 400);
  }

  const existingRole = await roleRepository.getRoleByName(name.trim());
  if (existingRole) {
    throw new AppError(`El rol con el nombre '${name}' ya existe`, 409);
  }

  const newRole = await roleRepository.createRole(name.trim(), description?.trim() ?? null);
  return newRole;
};

export const getRolesService = async ({ page = 1, limit = 10, name } = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
  const offset = (pageNum - 1) * limitNum;
  const { data, total } = await roleRepository.getRoles(limitNum, offset, name);

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

export const getRoleByIdService = async (id) => {
  const role = await roleRepository.getRoleById(id);
  if (!role) {
    throw new AppError("Rol no encontrado", 404);
  }
  return role;
};

export const updateRoleService = async (id, updateData) => {
  if (!updateData || (updateData.name === undefined && updateData.description === undefined)) {
    throw new AppError("Debes enviar al menos un campo para actualizar: 'name' o 'description'", 400);
  }

  if (updateData.name !== undefined) {
    if (typeof updateData.name !== "string" || updateData.name.trim().length < 2) {
      throw new AppError("El campo 'name' debe tener al menos 2 caracteres", 400);
    }
    updateData.name = updateData.name.trim();
  }

  const existingRole = await roleRepository.getRoleById(id);
  if (!existingRole) {
    throw new AppError("Rol no encontrado", 404);
  }

  if (updateData.name && updateData.name !== existingRole.name) {
    const roleWithSameName = await roleRepository.getRoleByName(
      updateData.name,
    );
    if (roleWithSameName) {
      throw new AppError(
        `El nombre de rol '${updateData.name}' ya está en uso por otro rol`,
        409,
      );
    }
  }

  const updatedRole = await roleRepository.updateRole(id, updateData);
  return updatedRole;
};
