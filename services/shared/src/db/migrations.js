// Database schema migrations for CodeAtlas
const { pool } = require('./pool');

const MIGRATIONS = [
  {
    name: '001_create_documents',
    sql: `
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(512) NOT NULL,
        original_path VARCHAR(1024),
        mime_type VARCHAR(128) NOT NULL DEFAULT 'text/plain',
        size_bytes BIGINT NOT NULL DEFAULT 0,
        language VARCHAR(64),
        repository_name VARCHAR(256),
        checksum VARCHAR(128),
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_documents_repository ON documents(repository_name);
      CREATE INDEX IF NOT EXISTS idx_documents_language ON documents(language);
      CREATE INDEX IF NOT EXISTS idx_documents_uploaded ON documents(uploaded_at);
    `,
  },
  {
    name: '002_create_ingestion_jobs',
    sql: `
      CREATE TABLE IF NOT EXISTS ingestion_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        priority INTEGER NOT NULL DEFAULT 0,
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        error_message TEXT,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
      );

      CREATE INDEX IF NOT EXISTS idx_jobs_status ON ingestion_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_document ON ingestion_jobs(document_id);
      CREATE INDEX IF NOT EXISTS idx_jobs_priority ON ingestion_jobs(priority DESC, created_at ASC);
    `,
  },
  {
    name: '003_create_chunk_metadata',
    sql: `
      CREATE TABLE IF NOT EXISTS chunk_metadata (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        job_id UUID NOT NULL REFERENCES ingestion_jobs(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        start_line INTEGER,
        end_line INTEGER,
        token_count INTEGER NOT NULL DEFAULT 0,
        chunk_type VARCHAR(32) NOT NULL DEFAULT 'raw',
        function_name VARCHAR(256),
        class_name VARCHAR(256),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT valid_chunk_type CHECK (chunk_type IN ('raw', 'function', 'class', 'module'))
      );

      CREATE INDEX IF NOT EXISTS idx_chunks_document ON chunk_metadata(document_id);
      CREATE INDEX IF NOT EXISTS idx_chunks_job ON chunk_metadata(job_id);
    `,
  },
  {
    name: '004_create_migrations_table',
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(256) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
];

async function getAppliedMigrations() {
  try {
    const result = await pool.query('SELECT name FROM schema_migrations ORDER BY applied_at');
    return new Set(result.rows.map((row) => row.name));
  } catch {
    return new Set();
  }
}

async function runMigrations() {
  const client = await pool.connect();

  try {
    await client.query(MIGRATIONS.find((m) => m.name === '004_create_migrations_table').sql);
    const applied = await getAppliedMigrations();

    for (const migration of MIGRATIONS) {
      if (applied.has(migration.name)) {
        process.stdout.write(`Skipping ${migration.name} (already applied)\n`);
        continue;
      }

      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [migration.name]);
        await client.query('COMMIT');
        process.stdout.write(`Applied ${migration.name}\n`);
      } catch (err) {
        await client.query('ROLLBACK');
        process.stderr.write(`Failed ${migration.name}: ${err.message}\n`);
        throw err;
      }
    }

    process.stdout.write('All migrations complete\n');
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigrations };
