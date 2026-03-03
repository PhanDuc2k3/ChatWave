function errorHandler(err, req, res, _next) {
  console.error("Core-service error:", err);

  const status = err.statusCode || 500;
  const message =
    status === 500 ? "Internal server error" : err.message || "Unknown error";

  res.status(status).json({
    message,
  });
}

module.exports = { errorHandler };

