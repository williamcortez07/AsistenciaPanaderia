import * as usuarioService from "./usuarioService.js";
import { asyncWrapper } from "../../utils/asyncWrappers.js";

export const login = asyncWrapper(async (req, res) => {
  const result = await usuarioService.loginService(req.body);

  res.status(200).json({
    success: true,
    message: "Inicio de sesión exitoso",
    data: result,
  });
});

export const createUser = asyncWrapper(async (req, res) => {
  const newUser = await usuarioService.createUserService(req.body);

  res.status(201).json({
    success: true,
    message: "Usuario creado exitosamente",
    data: newUser,
  });
});

export const getUsers = asyncWrapper(async (req, res) => {
  const result = await usuarioService.getUsersService(req.query);

  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
});

export const getUserById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const user = await usuarioService.getUserByIdService(id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const updateUser = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const updatedUser = await usuarioService.updateUserService(id, req.body);

  res.status(200).json({
    success: true,
    message: "Usuario actualizado exitosamente",
    data: updatedUser,
  });
});
