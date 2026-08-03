import { z } from "zod";

const estadoEnum = z.enum(["activo", "inactivo", "bloqueado"], {
  errorMap: () => ({
    message: "El estado debe ser 'activo', 'inactivo' o 'bloqueado'",
  }),
});

export const loginSchema = z.object({
  body: z.object({
    correo: z
      .string()
      .trim()
      .email("El correo electrónico no tiene un formato válido"),
    password: z.string().min(1, "La contraseña es requerida"),
  }),
  query: z.any(),
  params: z.any(),
});

export const createUserSchema = z.object({
  body: z.object({
    id_rol: z.string().uuid("El id_rol debe ser un UUID válido"),
    correo: z
      .string()
      .trim()
      .email("El correo electrónico no tiene un formato válido")
      .max(150, "El correo no puede exceder los 150 caracteres"),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .max(100, "La contraseña es demasiado larga"),
    estado: estadoEnum.default("activo").optional(),
  }),
  query: z.any(),
  params: z.any(),
});

export const updateUserSchema = z.object({
  body: z
    .object({
      id_rol: z.string().uuid("El id_rol debe ser un UUID válido").optional(),
      correo: z
        .string()
        .trim()
        .email("El correo electrónico no tiene un formato válido")
        .max(150)
        .optional(),
      password: z
        .string()
        .min(6, "La contraseña debe tener al menos 6 caracteres")
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

export const userIdParamSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID proporcionado no es un UUID válido"),
  }),
});

export const getUsersQuerySchema = z.object({
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
    id_rol: z.string().uuid().optional(),
  }),
});
