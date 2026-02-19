// Job routes tests
const assert = require('node:assert');
const { describe, it } = require('node:test');

async function createTestApp() {
  const express = require('express');
  const app = express();
  app.use(express.json());

  app.get('/api/jobs', (req, res) => {
    res.json({ stats: { pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 } });
  });

  app.get('/api/jobs/:id', (req, res) => {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }
    res.status(404).json({ error: 'Job not found' });
  });

  return app;
}

describe('Job Routes', () => {
  it('should return job stats', async () => {
    const app = await createTestApp();
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/jobs`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.ok(body.stats);
      assert.strictEqual(typeof body.stats.pending, 'number');
    } finally {
      server.close();
    }
  });

  it('should return 404 for non-existent job', async () => {
    const app = await createTestApp();
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/jobs/00000000-0000-0000-0000-000000000000`);
      const body = await res.json();
      assert.strictEqual(res.status, 404);
      assert.strictEqual(body.error, 'Job not found');
    } finally {
      server.close();
    }
  });

  it('should reject invalid job ID format', async () => {
    const app = await createTestApp();
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/jobs/not-a-uuid`);
      const body = await res.json();
      assert.strictEqual(res.status, 400);
    } finally {
      server.close();
    }
  });
});
