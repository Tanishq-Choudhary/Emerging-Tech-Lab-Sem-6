// Centralized error handling middleware
const logger = require('codeatlas-shared/src/logger');

function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  logger.error('Request error', {
    status,
    message: err.message,
    path: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

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
