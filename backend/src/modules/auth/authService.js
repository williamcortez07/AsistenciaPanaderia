import bcrypt from "bcryptjs";
import { AppError } from "../../utils/AppError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "../../utils/jwt.js";
import {
  findUserByCorreoForAuth,
  findUserByIdForAuth,
  updateLastLogin,
} from "./authRepository.js";

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const loginService = async ({ correo, password }) => {
  const cleanCorreo = correo?.trim().toLowerCase();
  const user = await findUserByCorreoForAuth(cleanCorreo);

  if (!user) {
    throw new AppError("Credenciales inválidas", 401);
  }
  if (user.estado !== "activo") {
    throw new AppError(
      `Tu cuenta está ${user.estado}. Contacta con el administrador.`,
      403,
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const tokenPayload = {
    id: user.id,
    correo: user.correo,
    id_rol: user.id_rol,
    nombre_rol: user.nombre_rol,
  };

  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken({ id: user.id });

  // Actualizar último acceso de forma no bloqueante
  updateLastLogin(user.id);

  return {
    accessToken,
    refreshToken,
    expiresIn: "24h",
    user: {
      id: user.id,
      correo: user.correo,
      id_rol: user.id_rol,
      nombre_rol: user.nombre_rol,
      estado: user.estado,
    },
  };
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
export const refreshTokenService = async ({ refreshToken }) => {
  let decoded;

  try {
    decoded = verifyToken(refreshToken);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError(
        "El refresh token ha expirado. Por favor inicia sesión nuevamente.",
        401,
      );
    }
    throw new AppError("Refresh token inválido.", 401);
  }

  const user = await findUserByIdForAuth(decoded.id);

  if (!user) {
    throw new AppError("Usuario no encontrado.", 401);
  }
  if (user.estado !== "activo") {
    throw new AppError("La cuenta no está activa.", 403);
  }

  const newAccessToken = signAccessToken({
    id: user.id,
    correo: user.correo,
    id_rol: user.id_rol,
    nombre_rol: user.nombre_rol,
  });

  return { accessToken: newAccessToken, expiresIn: "24h" };
};
