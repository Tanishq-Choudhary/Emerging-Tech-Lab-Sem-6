// Proxy route for forwarding queries to the RAG engine
const { Router } = require('express');
const http = require('http');
const config = require('../config');

const router = Router();

function forwardToRag(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, config.ragEngine.baseUrl);

    const payload = JSON.stringify(body);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: config.ragEngine.timeout,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('RAG engine request timed out'));
    });

    req.write(payload);
    req.end();
  });
}

router.post('/', async (req, res, next) => {
  try {
    const { question, top_k } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'question is required and must be a string' });
    }

    const ragResponse = await forwardToRag('/query', {
      question,
      top_k: top_k || 5,
    });

    res.status(ragResponse.status).json(ragResponse.body);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'RAG engine is not available',
        detail: 'The RAG service might not be running. Check deployment status.',
      });
    }
    next(err);
  }
});

module.exports = router;
