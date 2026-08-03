import { z } from "zod";

export const createRoleSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "El nombre del rol debe tener al menos 2 caracteres")
      .max(50, "El nombre del rol no puede exceder los 50 caracteres")
      .trim(),
    description: z.string().trim().optional(),
  }),
  query: z.any(),
  params: z.any(),
});

export const updateRoleSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(2, "El nombre del rol debe tener al menos 2 caracteres")
        .max(50, "El nombre del rol no puede exceder los 50 caracteres")
        .trim()
        .optional(),
      description: z.string().trim().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debe proporcionar al menos un campo para actualizar",
    }),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID proporcionado no es un UUID válido"),
  }),
});

export const roleIdParamSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    id: z.string().uuid("El ID proporcionado no es un UUID válido"),
  }),
});

export const getRolesQuerySchema = z.object({
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
