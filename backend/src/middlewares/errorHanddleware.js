export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode < 500
      ? err.message
      : err.message || "Error interno del servidor";

  // Log completo en servidor para debugging
  console.error(`[${new Date().toISOString()}] ${statusCode} - ${req.method} ${req.originalUrl}`);
  console.error(err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}
