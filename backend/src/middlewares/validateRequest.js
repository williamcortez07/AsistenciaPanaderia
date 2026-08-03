/**
 * Middleware de validación de peticiones usando schemas Zod.
 * Valida body, query y params según el schema proporcionado.
 * NOTA: req.query y req.params son getters de solo lectura en Express,
 * por lo que no se reasignan — solo se validan y los valores transformados
 * de body sí se aplican (body sí es writable).
 *
 * @param {import("zod").ZodTypeAny} schema - Schema Zod con forma { body, query, params }
 * @returns {import("express").RequestHandler}
 */
export const validateRequest = (schema) => (req, res, next) => {
  // Si no hay schema válido de Zod, pasar al siguiente middleware
  if (!schema || typeof schema.safeParse !== "function") {
    return next();
  }

  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const errors = result.error.flatten();
    return res.status(400).json({
      success: false,
      message: "Error de validación en los datos de la petición",
      errors: {
        body: errors.fieldErrors,
        formErrors: errors.formErrors,
      },
    });
  }

  // Solo body es writable en Express — aplicamos los datos transformados (trim, coerce, etc.)
  if (result.data.body !== undefined) {
    req.body = result.data.body;
  }

  next();
};
