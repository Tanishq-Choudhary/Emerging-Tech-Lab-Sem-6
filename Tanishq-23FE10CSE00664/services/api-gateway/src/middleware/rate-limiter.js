// Token bucket rate limiter
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const maxRequests = options.maxRequests || 100;
  const clients = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of clients) {
      if (now - data.windowStart > windowMs * 2) {
        clients.delete(key);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    let client = clients.get(key);
    if (!client || now - client.windowStart > windowMs) {
      client = { windowStart: now, count: 0 };
      clients.set(key, client);
    }

    client.count++;

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - client.count));
    res.setHeader('X-RateLimit-Reset', new Date(client.windowStart + windowMs).toISOString());

    if (client.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((client.windowStart + windowMs - now) / 1000),
      });
    }

    next();
  };
}

module.exports = createRateLimiter;
