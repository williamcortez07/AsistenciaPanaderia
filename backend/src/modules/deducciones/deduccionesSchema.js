import { z } from "zod";

const tipoEnum = z.enum(["porcentaje", "monto_fijo"], {
  errorMap: () => ({
    message: "El tipo debe ser 'porcentaje' o 'monto_fijo'",
  }),
});

export const createDeduccionSchema = z.object({
  body: z
    .object({
      nombre: z
        .string()
        .trim()
        .min(2, "El nombre de la deducción debe tener al menos 2 caracteres")
        .max(
          100,
          "El nombre de la deducción no puede exceder los 100 caracteres",
        ),
      descripcion: z.string().trim().optional().nullable(),
      tipo: tipoEnum,
      porcentaje: z.coerce.number().min(0).max(100).optional().nullable(),
      monto_fijo: z.coerce.number().min(0).optional().nullable(),
    })
    .superRefine((data, ctx) => {
      if (data.tipo === "porcentaje") {
        if (data.porcentaje === undefined || data.porcentaje === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "El campo 'porcentaje' es requerido para el tipo 'porcentaje'",
            path: ["porcentaje"],
          });
        }
      } else if (data.tipo === "monto_fijo") {
        if (data.monto_fijo === undefined || data.monto_fijo === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "El campo 'monto_fijo' es requerido para el tipo 'monto_fijo'",
            path: ["monto_fijo"],
          });
        }
      }
    }),
  query: z.any(),
  params: z.any(),
});

export const updateDeduccionSchema = z.object({
  body: z
    .object({
      nombre: z
        .string()
        .trim()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(100)
        .optional(),
      descripcion: z.string().trim().optional().nullable(),
      tipo: tipoEnum.optional(),
      porcentaje: z.coerce.number().min(0).max(100).optional().nullable(),
      monto_fijo: z.coerce.number().min(0).optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debe proporcionar al menos un campo para actualizar",
    }),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID proporcionado no es un UUID válido"),
  }),
});

export const deduccionIdParamSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID proporcionado no es un UUID válido"),
  }),
});

export const getDeduccionByNameSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    nombre: z.string().trim().min(1, "El nombre de la deducción es requerido"),
  }),
});

export const getDeduccionesQuerySchema = z.object({
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
    tipo: tipoEnum.optional(),
  }),
});
