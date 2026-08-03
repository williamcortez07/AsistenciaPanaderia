import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createVacacionSchema = z.object({
  body: z
    .object({
      id_empleado: z.string().uuid("El id_empleado debe ser un UUID válido"),
      fecha_inicio: z
        .string()
        .regex(dateRegex, "La fecha de inicio debe tener formato YYYY-MM-DD"),
      fecha_fin: z
        .string()
        .regex(dateRegex, "La fecha fin debe tener formato YYYY-MM-DD"),
      dias: z.coerce
        .number({ invalid_type_error: "El número de días debe ser numérico" })
        .int("El número de días debe ser un entero")
        .positive("El número de días debe ser mayor a 0"),
      motivo: z.string().trim().optional().nullable(),
    })
    .superRefine((data, ctx) => {
      if (new Date(data.fecha_fin) < new Date(data.fecha_inicio)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La fecha_fin debe ser mayor o igual a la fecha_inicio",
          path: ["fecha_fin"],
        });
      }
    }),
  query: z.any(),
  params: z.any(),
});

export const updateVacacionSchema = z.object({
  body: z
    .object({
      fecha_inicio: z
        .string()
        .regex(dateRegex, "La fecha de inicio debe tener formato YYYY-MM-DD")
        .optional(),
      fecha_fin: z
        .string()
        .regex(dateRegex, "La fecha fin debe tener formato YYYY-MM-DD")
        .optional(),
      dias: z.coerce
        .number()
        .int("El número de días debe ser entero")
        .positive("El número de días debe ser mayor a 0")
        .optional(),
      motivo: z.string().trim().optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debe proporcionar al menos un campo para actualizar",
    }),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID proporcionado no es un UUID válido"),
  }),
});

export const vacacionIdParamSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID proporcionado no es un UUID válido"),
  }),
});

export const getVacacionesQuerySchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    page: z.coerce.number().int().min(1).catch(1),
    limit: z.coerce.number().int().min(1).max(100).catch(10),
    id_empleado: z.string().uuid().optional(),
    fecha_desde: z
      .string()
      .regex(dateRegex)
      .transform((v) => (v === "" ? undefined : v))
      .optional(),
    fecha_hasta: z
      .string()
      .regex(dateRegex)
      .transform((v) => (v === "" ? undefined : v))
      .optional(),
  }),
});
