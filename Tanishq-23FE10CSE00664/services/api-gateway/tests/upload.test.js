// Upload endpoint tests
const assert = require('node:assert');
const { describe, it } = require('node:test');
const fs = require('fs');
const path = require('path');

async function createTestApp() {
  const express = require('express');
  const multer = require('multer');

  const app = express();
  const upload = multer({ dest: path.join(__dirname, '..', 'test-uploads') });

  app.post('/api/documents/upload', upload.array('files', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }
    const results = req.files.map((f) => ({
      originalName: f.originalname,
      size: f.size,
    }));
    res.status(201).json({ message: `${results.length} file(s) uploaded`, files: results });
  });

  return app;
}

describe('Upload Routes', () => {
  it('should reject requests without files', async () => {
    const app = await createTestApp();
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/documents/upload`, {
        method: 'POST',
      });
      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.error, 'No files provided');
    } finally {
      server.close();
    }
  });

  it('should accept file uploads', async () => {
    const app = await createTestApp();
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const boundary = '----TestBoundary' + Date.now();
      const fileContent = 'function hello() { return "world"; }';
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="files"; filename="test.js"',
        'Content-Type: text/javascript',
        '',
        fileContent,
        `--${boundary}--`,
      ].join('\r\n');

      const res = await fetch(`http://localhost:${port}/api/documents/upload`, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body,
      });

      const result = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(result.files.length, 1);
      assert.strictEqual(result.files[0].originalName, 'test.js');
    } finally {
      server.close();
      const uploadDir = path.join(__dirname, '..', 'test-uploads');
      if (fs.existsSync(uploadDir)) {
        fs.rmSync(uploadDir, { recursive: true });
      }
    }
  });
});
