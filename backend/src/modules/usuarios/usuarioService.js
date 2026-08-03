import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as usuarioRepository from "./usuarioRepository.js";
import { AppError } from "../../utils/appError.js";

const JWT_SECRET = process.env.JWT_SECRET || "secreto_super_seguro_desarrollo";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

export const loginService = async ({ correo, password }) => {
  const cleanEmail = correo?.trim().toLowerCase();

  const user = await usuarioRepository.getUserForAuth(cleanEmail);
  if (!user) {
    throw new AppError("Credenciales inválidas", 401);
  }

  if (user.estado !== "activo") {
    throw new AppError(
      `Su cuenta está ${user.estado}. Contacte al administrador.`,
      403,
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError("Credenciales inválidas", 401);
  }

  // Registrar último acceso de manera asíncrona
  usuarioRepository.updateLastLogin(user.id);

  const payload = {
    id: user.id,
    correo: user.correo,
    id_rol: user.id_rol,
    rol: user.nombre_rol,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    token,
    user: {
      id: user.id,
      correo: user.correo,
      id_rol: user.id_rol,
      nombre_rol: user.nombre_rol,
      estado: user.estado,
    },
  };
};

export const createUserService = async ({
  id_rol,
  correo,
  password,
  estado = "activo",
}) => {
  const cleanEmail = correo?.trim().toLowerCase();

  const existingUser = await usuarioRepository.getUserForAuth(cleanEmail);
  if (existingUser) {
    throw new AppError("El correo electrónico ya está registrado", 409);
  }

  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  const newUser = await usuarioRepository.createUser({
    id_rol,
    correo: cleanEmail,
    password_hash,
    estado,
  });

  return newUser;
};

export const getUsersService = async ({
  page = 1,
  limit = 10,
  search,
  estado,
  id_rol,
} = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
  const offset = (pageNum - 1) * limitNum;

  const { data, total } = await usuarioRepository.getUsers({
    limit: limitNum,
    offset,
    search: search?.trim(),
    estado,
    id_rol,
  });

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

export const getUserByIdService = async (id) => {
  const user = await usuarioRepository.getUserById(id);
  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }
  return user;
};

export const updateUserService = async (id, updateData) => {
  if (!updateData || Object.keys(updateData).length === 0) {
    throw new AppError("Debes enviar al menos un campo para actualizar", 400);
  }

  const existingUser = await usuarioRepository.getUserById(id);
  if (!existingUser) {
    throw new AppError("Usuario no encontrado", 404);
  }

  const formattedData = {};

  if (updateData.id_rol !== undefined) formattedData.id_rol = updateData.id_rol;
  if (updateData.estado !== undefined) formattedData.estado = updateData.estado;

  if (updateData.correo !== undefined) {
    formattedData.correo = updateData.correo.trim().toLowerCase();
  }

  if (updateData.password !== undefined && updateData.password.trim() !== "") {
    if (updateData.password.length < 6) {
      throw new AppError("La contraseña debe tener al menos 6 caracteres", 400);
    }
    formattedData.password_hash = await bcrypt.hash(updateData.password, 10);
  }

  const updatedUser = await usuarioRepository.updateUser(id, formattedData);
  return updatedUser;
};
