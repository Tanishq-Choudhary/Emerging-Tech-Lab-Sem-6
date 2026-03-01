// Centralized error handling middleware
function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  const response = {
    error: message,
    status,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development' && status === 500) {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}

module.exports = errorHandler;
