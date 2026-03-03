function requestLogger(req, _res, next) {
  const startedAt = Date.now();

  // Attach for later middlewares/handlers if needed
  req.context = {
    ...req.context,
    requestId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt,
  };

  next();
}

module.exports = { requestLogger };

