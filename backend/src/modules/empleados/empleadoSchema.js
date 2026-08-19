import { z } from "zod";

const estadoEnum = z.enum(["activo", "inactivo", "suspendido", "retirado"], {
  errorMap: () => ({
    message:
      "El estado debe ser 'activo', 'inactivo', 'suspendido' o 'retirado'",
  }),
});

// Expresión regular para validar formato de fecha YYYY-MM-DD
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/* ==========================================================================
   ESQUEMAS PRINCIPALES: EMPLEADOS
   ========================================================================== */

export const createEmpleadoSchema = z.object({
  body: z.object({
    id_cargo: z.string().uuid("El id_cargo debe ser un UUID válido"),
    id_usuario: z
      .string()
      .uuid("El id_usuario debe ser un UUID válido")
      .optional()
      .nullable(),
    id_supervisor: z
      .string()
      .uuid("El id_supervisor debe ser un UUID válido")
      .optional()
      .nullable(),
    codigo_empleado: z
      .string()
      .trim()
      .min(1, "El código de empleado es requerido")
      .max(20, "El código de empleado no puede exceder los 20 caracteres"),
    cedula: z
      .string()
      .trim()
      .min(1, "La cédula es requerida")
      .max(20, "La cédula no puede exceder los 20 caracteres"),
    nombres: z
      .string()
      .trim()
      .min(2, "Los nombres deben tener al menos 2 caracteres")
      .max(100, "Los nombres no pueden exceder los 100 caracteres"),
    apellidos: z
      .string()
      .trim()
      .min(2, "Los apellidos deben tener al menos 2 caracteres")
      .max(100, "Los apellidos no pueden exceder los 100 caracteres"),
    telefono: z.string().trim().max(20).optional().nullable(),
    direccion: z.string().trim().optional().nullable(),
    fecha_contratacion: z
      .string()
      .regex(
        dateRegex,
        "La fecha de contratación debe tener el formato YYYY-MM-DD",
      ),
    salario_base: z.coerce
      .number({ invalid_type_error: "El salario base debe ser un número" })
      .min(0, "El salario base no puede ser negativo"),
    estado: estadoEnum.default("activo").optional(),
  }),
  query: z.any(),
  params: z.any(),
});

export const updateEmpleadoSchema = z.object({
  body: z
    .object({
      id_cargo: z
        .string()
        .uuid("El id_cargo debe ser un UUID válido")
        .optional(),
      id_usuario: z
        .string()
        .uuid("El id_usuario debe ser un UUID válido")
        .optional()
        .nullable(),
      id_supervisor: z
        .string()
        .uuid("El id_supervisor debe ser un UUID válido")
        .optional()
        .nullable(),
      codigo_empleado: z
        .string()
        .trim()
        .min(1, "El código de empleado no puede estar vacío")
        .max(20, "El código de empleado no puede exceder los 20 caracteres")
        .optional(),
      cedula: z
        .string()
        .trim()
        .min(1, "La cédula no puede estar vacía")
        .max(20, "La cédula no puede exceder los 20 caracteres")
        .optional(),
      nombres: z
        .string()
        .trim()
        .min(2, "Los nombres deben tener al menos 2 caracteres")
        .max(100, "Los nombres no pueden exceder los 100 caracteres")
        .optional(),
      apellidos: z
        .string()
        .trim()
        .min(2, "Los apellidos deben tener al menos 2 caracteres")
        .max(100, "Los apellidos no pueden exceder los 100 caracteres")
        .optional(),
      telefono: z.string().trim().max(20).optional().nullable(),
      direccion: z.string().trim().optional().nullable(),
      fecha_contratacion: z
        .string()
        .regex(
          dateRegex,
          "La fecha de contratación debe tener el formato YYYY-MM-DD",
        )
        .optional(),
      salario_base: z.coerce
        .number({ invalid_type_error: "El salario base debe ser un número" })
        .min(0, "El salario base no puede ser negativo")
        .optional(),
      estado: estadoEnum.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debe proporcionar al menos un campo para actualizar",
    }),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID proporcionado no es un UUID válido"),
  }),
});

export const empleadoIdParamSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID proporcionado no es un UUID válido"),
  }),
});

export const getEmpleadoByCodigoSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    codigo: z.string().trim().min(1, "El código de empleado es requerido"),
  }),
});

export const getEmpleadosQuerySchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    page: z.coerce.number().int().min(1).catch(1),
    limit: z.coerce.number().int().min(1).max(100).catch(10),
    search: z
      .string()
      .trim()
      .transform((v) => (v === "" ? undefined : v))
      .optional(),
    estado: estadoEnum.optional(),
  }),
});

/* ==========================================================================
   ESQUEMAS SUBRECURSO: EMPLEADO_DEDUCCIONES
   ========================================================================== */

export const assignDeduccionSchema = z.object({
  body: z.object({
    id_deduccion: z.string().uuid("El id_deduccion debe ser un UUID válido"),
  }),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID de empleado proporcionado no es un UUID válido"),
  }),
});

export const removeDeduccionSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID de empleado proporcionado no es un UUID válido"),
    deduccionId: z
      .string()
      .uuid("El ID de deducción proporcionado no es un UUID válido"),
  }),
});
