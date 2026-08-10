import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const uuidSchema = z.string().uuid("ID debe ser un UUID válido");

// --- PERIODOS DE EVALUACIÓN ---
export const createPeriodoSchema = z.object({
  body: z
    .object({
      nombre: z.string().trim().min(1, "El nombre del periodo es requerido"),
      fecha_inicio: z
        .string()
        .regex(dateRegex, "La fecha_inicio debe tener formato YYYY-MM-DD"),
      fecha_fin: z
        .string()
        .regex(dateRegex, "La fecha_fin debe tener formato YYYY-MM-DD"),
      duracion_meses: z.coerce
        .number()
        .int()
        .positive("duracion_meses debe ser mayor a 0")
        .default(6),
      estado: z.enum(["abierto", "cerrado", "cancelado"]).default("abierto"),
    })
    .superRefine((data, ctx) => {
      if (new Date(data.fecha_fin) < new Date(data.fecha_inicio)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La fecha_fin debe ser posterior o igual a la fecha_inicio",
          path: ["fecha_fin"],
        });
      }
    }),
  query: z.any(),
  params: z.any(),
});

export const updatePeriodoSchema = z.object({
  body: z
    .object({
      nombre: z.string().trim().min(1).optional(),
      fecha_inicio: z.string().regex(dateRegex).optional(),
      fecha_fin: z.string().regex(dateRegex).optional(),
      duracion_meses: z.coerce.number().int().positive().optional(),
      estado: z.enum(["abierto", "cerrado", "cancelado"]).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debe enviar al menos un campo a actualizar",
    }),
  query: z.any(),
  params: z.object({
    id: uuidSchema,
  }),
});

export const updateEstadoPeriodoSchema = z.object({
  body: z.object({
    estado: z.enum(["abierto", "cerrado", "cancelado"], {
      required_error: "El estado es requerido",
    }),
  }),
  query: z.any(),
  params: z.object({
    id: uuidSchema,
  }),
});

export const getPeriodosQuerySchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    page: z.coerce.number().int().min(1).catch(1),
    limit: z.coerce.number().int().min(1).max(100).catch(10),
    estado: z.enum(["abierto", "cerrado", "cancelado"]).optional(),
  }),
});

// --- CRITERIOS BASE ---
export const createCriterioSchema = z.object({
  body: z.object({
    nombre: z.string().trim().min(1, "El nombre del criterio es requerido"),
    descripcion: z.string().trim().optional().nullable(),
    activo: z.boolean().default(true),
    orden: z.coerce.number().int().default(1),
  }),
  query: z.any(),
  params: z.any(),
});

export const updateCriterioSchema = z.object({
  body: z
    .object({
      nombre: z.string().trim().min(1).optional(),
      descripcion: z.string().trim().optional().nullable(),
      activo: z.boolean().optional(),
      orden: z.coerce.number().int().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debe enviar al menos un campo a actualizar",
    }),
  query: z.any(),
  params: z.object({
    id: uuidSchema,
  }),
});

export const getCriteriosQuerySchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    activo: z
      .string()
      .transform((val) => val === "true" || val === "1")
      .optional(),
  }),
});

// --- CRITERIOS POR PERIODO ---
export const createCriterioPeriodoSchema = z.object({
  body: z.object({
    id_criterio: uuidSchema,
    ponderacion: z.coerce
      .number()
      .min(0, "La ponderación debe ser >= 0")
      .max(100, "La ponderación debe ser <= 100"),
    puntuacion_maxima: z.coerce
      .number()
      .positive("La puntuación máxima debe ser mayor a 0")
      .default(100),
    orden: z.coerce.number().int().default(1),
  }),
  query: z.any(),
  params: z.object({
    id_periodo: uuidSchema,
  }),
});

export const updateCriterioPeriodoSchema = z.object({
  body: z
    .object({
      ponderacion: z.coerce.number().min(0).max(100).optional(),
      puntuacion_maxima: z.coerce.number().positive().optional(),
      orden: z.coerce.number().int().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debe enviar al menos un campo para actualizar",
    }),
  query: z.any(),
  params: z.object({
    id_periodo: uuidSchema,
    id: uuidSchema,
  }),
});

// --- EVALUACIONES DE DESEMPEÑO ---
export const createEvaluacionSchema = z.object({
  body: z.object({
    id_empleado: uuidSchema,
    id_periodo: uuidSchema,
    id_evaluador: uuidSchema.optional().nullable(),
    observaciones: z.string().trim().optional().nullable(),
  }),
  query: z.any(),
  params: z.any(),
});

export const updateEvaluacionSchema = z.object({
  body: z
    .object({
      id_evaluador: uuidSchema.optional().nullable(),
      observaciones: z.string().trim().optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debe enviar al menos un campo a actualizar",
    }),
  query: z.any(),
  params: z.object({
    id: uuidSchema,
  }),
});

export const updateEstadoEvaluacionSchema = z.object({
  body: z.object({
    estado: z.enum(
      ["borrador", "en_proceso", "completada", "aprobada", "cancelada"],
      { required_error: "El estado de evaluación es requerido" }
    ),
  }),
  query: z.any(),
  params: z.object({
    id: uuidSchema,
  }),
});

export const getEvaluacionesQuerySchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    page: z.coerce.number().int().min(1).catch(1),
    limit: z.coerce.number().int().min(1).max(100).catch(10),
    id_empleado: uuidSchema.optional(),
    id_periodo: uuidSchema.optional(),
    id_evaluador: uuidSchema.optional(),
    estado: z
      .enum(["borrador", "en_proceso", "completada", "aprobada", "cancelada"])
      .optional(),
  }),
});

// --- RESULTADOS EN BULK ---
export const saveResultadosBulkSchema = z.object({
  body: z.object({
    resultados: z
      .array(
        z.object({
          id_criterio_periodo: uuidSchema,
          puntuacion: z.coerce
            .number()
            .min(0, "La puntuación no puede ser negativa"),
          comentario: z.string().trim().optional().nullable(),
          cumplido: z.boolean().optional().nullable(),
        })
      )
      .min(1, "Debe incluir al menos un resultado en el arreglo"),
  }),
  query: z.any(),
  params: z.object({
    id_evaluacion: uuidSchema,
  }),
});

// --- OBJETIVOS DE EMPLEADO ---
export const createObjetivoSchema = z.object({
  body: z.object({
    id_empleado: uuidSchema,
    id_periodo: uuidSchema,
    titulo: z.string().trim().min(1, "El título del objetivo es requerido"),
    descripcion: z.string().trim().optional().nullable(),
    meta: z.coerce.number().optional().nullable(),
    resultado: z.coerce.number().optional().nullable(),
    porcentaje_cumplimiento: z.coerce
      .number()
      .min(0)
      .max(100)
      .optional()
      .nullable(),
    estado: z
      .enum(["pendiente", "en_progreso", "cumplido", "no_cumplido"])
      .default("pendiente"),
  }),
  query: z.any(),
  params: z.any(),
});

export const updateObjetivoSchema = z.object({
  body: z
    .object({
      titulo: z.string().trim().min(1).optional(),
      descripcion: z.string().trim().optional().nullable(),
      meta: z.coerce.number().optional().nullable(),
      resultado: z.coerce.number().optional().nullable(),
      porcentaje_cumplimiento: z.coerce.number().min(0).max(100).optional().nullable(),
      estado: z
        .enum(["pendiente", "en_progreso", "cumplido", "no_cumplido"])
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debe enviar al menos un campo para actualizar",
    }),
  query: z.any(),
  params: z.object({
    id: uuidSchema,
  }),
});

export const getObjetivosQuerySchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    id_empleado: uuidSchema.optional(),
    id_periodo: uuidSchema.optional(),
    estado: z
      .enum(["pendiente", "en_progreso", "cumplido", "no_cumplido"])
      .optional(),
  }),
});

// GENERIC PARAM SCHEMAS
export const genericIdParamSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    id: uuidSchema,
  }),
});

export const genericPeriodoIdParamSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    id_periodo: uuidSchema,
  }),
});

export const genericEvaluacionIdParamSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    id_evaluacion: uuidSchema,
  }),
});
