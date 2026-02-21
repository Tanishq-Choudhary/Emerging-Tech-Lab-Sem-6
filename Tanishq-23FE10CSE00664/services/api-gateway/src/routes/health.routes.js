// Health check endpoints for liveness and readiness probes
const { Router } = require('express');
const { healthCheck } = require('codeatlas-shared/src/db/pool');

const router = Router();

router.get('/', async (req, res) => {
  const dbHealth = await healthCheck();
  const status = dbHealth.status === 'healthy' ? 200 : 503;

  res.status(status).json({
    service: 'api-gateway',
    status: dbHealth.status,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbHealth,
  });
});

router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

module.exports = router;
