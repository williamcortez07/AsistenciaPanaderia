import * as authService from "./authService.js";
import { asyncWrapper } from "../../utils/asyncWrappers.js";

export const login = asyncWrapper(async (req, res) => {
  const result = await authService.loginService(req.body);
  res.status(200).json({
    success: true,
    message: "Inicio de sesión exitoso",
    data: result,
  });
});

export const refreshToken = asyncWrapper(async (req, res) => {
  const result = await authService.refreshTokenService(req.body);
  res.status(200).json({
    success: true,
    message: "Token renovado exitosamente",
    data: result,
  });
});

export const logout = asyncWrapper(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Sesión cerrada exitosamente. Descarta tus tokens en el cliente.",
  });
});

export const getMe = asyncWrapper(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Perfil del usuario autenticado",
    data: req.user,
  });
});
