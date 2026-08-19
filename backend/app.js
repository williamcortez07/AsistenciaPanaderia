import express from "express";
import cors from "cors";
import { env } from "./src/config/environment.js";
import asistenciaRoutes from "./src/modules/asistencia/asistenciaRoutes.js";
import authRoutes from "./src/modules/auth/authRoutes.js";
import cargoRoutes from "./src/modules/cargos/cargoRoutes.js";
import deduccionesRoutes from "./src/modules/deducciones/deduccionesRoutes.js";
import empleadoRoutes from "./src/modules/empleados/empleadoRoutes.js";
import planillaRoutes from "./src/modules/planilla/planillaRoutes.js";
import roleRoutes from "./src/modules/roles/rolRoutes.js";
import usuarioRoutes from "./src/modules/usuarios/usuarioRoutes.js";
import vacacionesRoutes from "./src/modules/vacaciones/vacacionesRoutes.js";
import evaluacionesRoutes from "./src/modules/evaluaciones/evaluacionesRoutes.js";
import errorHandler from "./src/middlewares/errorHanddleware.js";
import { setupSwagger, swaggerSpec } from "./src/config/swagger.js";
import { initializeEvaluacionesTables } from "./src/config/dbInit.js";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "controlAsistencia" });
});

app.use("/api/v1/asistencia", asistenciaRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/cargos", cargoRoutes);
app.use("/api/v1/deducciones", deduccionesRoutes);
app.use("/api/v1/evaluaciones", evaluacionesRoutes);
app.use("/api/v1/empleados", empleadoRoutes);
app.use("/api/v1/planilla", planillaRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/usuarios", usuarioRoutes);
app.use("/api/v1/vacaciones", vacacionesRoutes);

setupSwagger(app);

app.use(errorHandler);

function logStartupInfo(port) {
  const routes = [
    { path: "/health", methods: ["GET"] },
    { path: "/api/v1/docs", methods: ["GET"] },
    { path: "/api/v1/docs.json", methods: ["GET"] },
    ...Object.entries(swaggerSpec.paths || {}).map(([path, methods]) => ({
      path,
      methods: Object.keys(methods || {}).map((method) => method.toUpperCase()),
    })),
  ];

  const uniqueRoutes = routes.reduce((acc, route) => {
    const existing = acc.find((item) => item.path === route.path);

    if (existing) {
      existing.methods = [...new Set([...existing.methods, ...route.methods])];
      return acc;
    }

    acc.push(route);
    return acc;
  }, []);

  console.log("\n=== API iniciada ===");
  console.log(`Swagger UI: http://localhost:${port}/api/v1/docs`);
  console.log(`Swagger JSON: http://localhost:${port}/api/v1/docs.json`);
  console.log("Endpoints expuestos:");
  uniqueRoutes.forEach(({ path, methods }) => {
    console.log(`- ${methods.join(", ")} ${path}`);
  });
  console.log("===================\n");
}

export function startServer(port = env.PORT) {
  initializeEvaluacionesTables().catch((err) =>
    console.error("Error al inicializar tablas de evaluaciones:", err)
  );
  return app.listen(port, () => {
    logStartupInfo(port);
  });
}

export default app;

const isMain = process.argv[1] && process.argv[1].endsWith("app.js");
if (isMain) {
  startServer(env.PORT);
}
