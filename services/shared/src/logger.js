// Structured logging utility for all platform services
const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'] ?? LOG_LEVELS.info;

function formatMessage(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: process.env.SERVICE_NAME || 'unknown',
    pid: process.pid,
  };

  if (Object.keys(meta).length > 0) {
    entry.meta = meta;
  }

  return JSON.stringify(entry);
}

function shouldLog(level) {
  return LOG_LEVELS[level] <= currentLevel;
}

function error(message, meta = {}) {
  if (shouldLog('error')) {
    process.stderr.write(formatMessage('error', message, meta) + '\n');
  }
}

function warn(message, meta = {}) {
  if (shouldLog('warn')) {
    process.stderr.write(formatMessage('warn', message, meta) + '\n');
  }
}

function info(message, meta = {}) {
  if (shouldLog('info')) {
    process.stdout.write(formatMessage('info', message, meta) + '\n');
  }
}

function debug(message, meta = {}) {
  if (shouldLog('debug')) {
    process.stdout.write(formatMessage('debug', message, meta) + '\n');
  }
}

function requestLogger() {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      info('request', {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    });

    next();
  };
}

module.exports = { error, warn, info, debug, requestLogger };
