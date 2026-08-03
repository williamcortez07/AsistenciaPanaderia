import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { env } from "./environment.js";
import { fileURLToPath } from "url";
import path from "path";

// Resolvemos la raíz del proyecto de forma absoluta para que swagger-jsdoc
// encuentre los archivos independientemente del directorio de trabajo (CWD)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Control de Asistencia y Nómina - MIPYME",
      version: "1.0.0",
      description:
        "API RESTful para la gestión integral de recursos humanos: control de marcaciones (check-in / check-out), expediente de empleados, asignación de deducciones, solicitudes de vacaciones y generación automatizada de planillas.",
      contact: {
        name: "Soporte Técnico de RRHH",
        email: "soporte.rrhh@empresa.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: "Servidor de Desarrollo Local",
      },
    ],
    // Seguridad global: todos los endpoints protegidos requieren Bearer JWT
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Introduce tu token JWT en el formato: Bearer <token>",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Mensaje explicativo del error",
            },
            errors: {
              type: "object",
              description: "Detalles de errores de validación (opcional)",
            },
          },
        },
        UnauthorizedError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: {
              type: "string",
              example:
                "Acceso denegado. Se requiere un token de autenticación.",
            },
          },
        },
        ForbiddenError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: {
              type: "string",
              example:
                "No tienes permisos suficientes para realizar esta acción.",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Autenticación",
        description: "Endpoints de inicio de sesión y gestión de sesión",
      },
      {
        name: "Usuarios",
        description: "Administración de cuentas de usuario del sistema",
      },
      {
        name: "Empleados",
        description: "Gestión del expediente y datos personales del personal",
      },
      {
        name: "Empleados - Deducciones",
        description:
          "Subrecurso para la asignación de deducciones por empleado",
      },
      {
        name: "Asistencia",
        description:
          "Marcaciones temporales (Check-in / Check-out) y control de tardanzas",
      },
      {
        name: "Vacaciones",
        description: "Registro, consulta y gestión de solicitudes vacacionales",
      },
      {
        name: "Planilla",
        description:
          "Generación transaccional de nómina y consulta de detalle salarial",
      },
      {
        name: "Roles",
        description: "Catálogo de roles y accesos del sistema",
      },
      {
        name: "Cargos",
        description: "Catálogo de puestos laborales y horarios asignados",
      },
      {
        name: "Deducciones",
        description:
          "Catálogo de conceptos deductivos (porcentaje y monto fijo)",
      },
    ],
  },
  // Construcción de la ruta con slashes explícitos para compatibilidad entre SO (Windows/Linux/Mac)
  apis: [`${projectRoot.replace(/\\/g, "/")}/src/modules/**/*.js`],
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  // Opciones de personalización estacional/estética para Swagger UI
  const swaggerUiOptions = {
    swaggerOptions: {
      persistAuthorization: true, // Mantiene el token JWT cargado tras recargar la página
      filter: true, // Habilita barra de búsqueda en la UI de Swagger
    },
    customSiteTitle: "API Control de Asistencia y Planilla - Documentación",
  };

  app.use(
    "/api/v1/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerUiOptions),
  );

  // Endpoint en formato JSON para herramientas de pruebas (Postman/Insomnia) o integraciones CI/CD
  app.get("/api/v1/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};
