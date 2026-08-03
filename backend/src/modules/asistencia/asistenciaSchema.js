import { z } from "zod";

const estadoAsistenciaEnum = z.enum(
  ["presente", "ausente", "tardanza", "permiso"],
  {
    errorMap: () => ({
      message:
        "El estado debe ser 'presente', 'ausente', 'tardanza' o 'permiso'",
    }),
  },
);

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const checkInSchema = z.object({
  body: z.object({
    id_empleado: z.string().uuid("El id_empleado debe ser un UUID válido"),
    observacion: z.string().trim().optional().nullable(),
  }),
  query: z.any(),
  params: z.any(),
});

export const checkOutSchema = z.object({
  body: z.object({
    id_empleado: z.string().uuid("El id_empleado debe ser un UUID válido"),
    observacion: z.string().trim().optional().nullable(),
  }),
  query: z.any(),
  params: z.any(),
});

export const updateAsistenciaSchema = z.object({
  body: z
    .object({
      fecha: z
        .string()
        .regex(dateRegex, "Formato de fecha YYYY-MM-DD")
        .optional(),
      hora_entrada: z
        .string()
        .regex(timeRegex, "Formato de hora HH:mm o HH:mm:ss")
        .optional()
        .nullable(),
      hora_salida: z
        .string()
        .regex(timeRegex, "Formato de hora HH:mm o HH:mm:ss")
        .optional()
        .nullable(),
      estado: estadoAsistenciaEnum.optional(),
      observacion: z.string().trim().optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debe proporcionar al menos un campo para actualizar",
    }),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID proporcionado no es un UUID válido"),
  }),
});

export const asistenciaIdParamSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID proporcionado no es un UUID válido"),
  }),
});

export const getAsistenciasQuerySchema = z.object({
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
    estado: estadoAsistenciaEnum.optional(),
  }),
});
