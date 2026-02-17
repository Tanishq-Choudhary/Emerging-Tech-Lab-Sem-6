// PostgreSQL connection pool configuration
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT, 10) || 5432,
  database: process.env.PG_DATABASE || 'codeatlas',
  user: process.env.PG_USER || 'codeatlas',
  password: process.env.PG_PASSWORD || 'codeatlas_dev',
  max: parseInt(process.env.PG_POOL_MAX, 10) || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  process.stderr.write(`Unexpected pool error: ${err.message}\n`);
});

async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (duration > 1000) {
    process.stderr.write(`Slow query (${duration}ms): ${text}\n`);
  }

  return result;
}

async function getClient() {
  const client = await pool.connect();
  const originalRelease = client.release.bind(client);

  client.release = () => {
    client.release = originalRelease;
    return originalRelease();
  };

  return client;
}

async function healthCheck() {
  try {
    const result = await pool.query('SELECT NOW()');
    return { status: 'healthy', timestamp: result.rows[0].now };
  } catch (err) {
    return { status: 'unhealthy', error: err.message };
  }
}

async function shutdown() {
  await pool.end();
}

module.exports = { pool, query, getClient, healthCheck, shutdown };
