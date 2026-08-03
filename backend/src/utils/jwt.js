import jwt from "jsonwebtoken";

export const signAccessToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET || "dev-secret", { expiresIn: "24h" });
export const signRefreshToken = (payload) => jwt.sign(payload, process.env.JWT_REFRESH_SECRET || "dev-refresh-secret", { expiresIn: "7d" });
export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
