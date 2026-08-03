import { z } from "zod";

// Expresión regular para validar formato de hora en 24h (HH:mm o HH:mm:ss)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

const timeSchema = z
  .string()
  .trim()
  .regex(
    timeRegex,
    "El formato de hora debe ser HH:mm o HH:mm:ss (ej: 08:00 o 17:30:00)",
  )
  .optional()
  .nullable();

export const createCargoSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre del cargo debe tener al menos 2 caracteres")
      .max(100, "El nombre del cargo no puede exceder los 100 caracteres"),
    description: z.string().trim().optional().nullable(),
    horario_entrada: timeSchema,
    horario_salida: timeSchema,
  }),
  query: z.any(),
  params: z.any(),
});

export const updateCargoSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "El nombre del cargo debe tener al menos 2 caracteres")
        .max(100, "El nombre del cargo no puede exceder los 100 caracteres")
        .optional(),
      description: z.string().trim().optional().nullable(),
      horario_entrada: timeSchema,
      horario_salida: timeSchema,
    })
    .refine(
      (data) =>
        data.name !== undefined ||
        data.description !== undefined ||
        data.horario_entrada !== undefined ||
        data.horario_salida !== undefined,
      {
        message:
          "Debe proporcionar al menos un campo para actualizar (name, description, horario_entrada o horario_salida)",
      },
    ),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID proporcionado no es un UUID válido"),
  }),
});

export const cargoIdParamSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID proporcionado no es un UUID válido"),
  }),
});

export const getCargoByNameSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    nombre: z.string().trim().min(1, "El nombre del cargo es requerido"),
  }),
});

export const getCargosQuerySchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    page: z.coerce.number().int().min(1).catch(1),
    limit: z.coerce.number().int().min(1).max(100).catch(10),
    name: z
      .string()
      .trim()
      .transform((v) => (v === "" ? undefined : v))
      .optional(),
  }),
});
