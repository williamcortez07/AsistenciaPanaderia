import { z } from "zod";

const estadoPlanillaEnum = z.enum(["generada", "pagada", "anulada"], {
  errorMap: () => ({
    message: "El estado debe ser 'generada', 'pagada' o 'anulada'",
  }),
});

export const createPlanillaSchema = z.object({
  body: z.object({
    mes: z.coerce
      .number({ invalid_type_error: "El mes debe ser numérico" })
      .int("El mes debe ser un número entero")
      .min(1, "El mes debe estar entre 1 y 12")
      .max(12, "El mes debe estar entre 1 y 12"),
    anio: z.coerce
      .number({ invalid_type_error: "El año debe ser numérico" })
      .int("El año debe ser un número entero")
      .min(2000, "El año debe ser mayor o igual a 2000"),
  }),
  query: z.any(),
  params: z.any(),
});

export const updatePlanillaEstadoSchema = z.object({
  body: z.object({
    estado: z.enum(["pagada", "anulada"], {
      errorMap: () => ({
        message: "El nuevo estado solo puede ser 'pagada' o 'anulada'",
      }),
    }),
  }),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID proporcionado no es un UUID válido"),
  }),
});

export const planillaIdParamSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID proporcionado no es un UUID válido"),
  }),
});

export const getPlanillasQuerySchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    page: z.coerce.number().int().min(1).catch(1),
    limit: z.coerce.number().int().min(1).max(100).catch(10),
    anio: z.coerce.number().int().min(2000).optional(),
    mes: z.coerce.number().int().min(1).max(12).optional(),
    estado: estadoPlanillaEnum.optional(),
  }),
});
