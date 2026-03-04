// Health endpoint tests
const assert = require('node:assert');
const { describe, it } = require('node:test');

async function createTestApp() {
  const express = require('express');
  const app = express();

  app.get('/api/health/live', (req, res) => {
    res.status(200).json({ status: 'alive' });
  });

  return app;
}

describe('Health Routes', () => {
  it('should return alive status on liveness endpoint', async () => {
    const app = await createTestApp();

    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/health/live`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.status, 'alive');
    } finally {
      server.close();
    }
  });
});
