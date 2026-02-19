// Data access layer for ingestion jobs with polling-based queue
const { query, getClient } = require('codeatlas-shared/src/db/pool');
const { JOB_STATUS } = require('codeatlas-shared/src/constants');
const JobModel = require('../models/job.model');

async function create(documentId, priority = 0) {
  const sql = `
    INSERT INTO ingestion_jobs (document_id, priority)
    VALUES ($1, $2)
    RETURNING *
  `;
  const result = await query(sql, [documentId, priority]);
  return JobModel.fromRow(result.rows[0]);
}

async function findById(id) {
  const result = await query('SELECT * FROM ingestion_jobs WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  return JobModel.fromRow(result.rows[0]);
}

async function findByDocumentId(documentId) {
  const sql = 'SELECT * FROM ingestion_jobs WHERE document_id = $1 ORDER BY created_at DESC';
  const result = await query(sql, [documentId]);
  return result.rows.map(JobModel.fromRow);
}

async function claimNextJob() {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const sql = `
      UPDATE ingestion_jobs
      SET status = $1, started_at = NOW(), attempts = attempts + 1, updated_at = NOW()
      WHERE id = (
        SELECT id FROM ingestion_jobs
        WHERE status = $2
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `;

    const result = await client.query(sql, [JOB_STATUS.PROCESSING, JOB_STATUS.PENDING]);
    await client.query('COMMIT');

    if (result.rows.length === 0) return null;
    return JobModel.fromRow(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function markCompleted(id) {
  const sql = `
    UPDATE ingestion_jobs
    SET status = $1, completed_at = NOW(), updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;
  const result = await query(sql, [JOB_STATUS.COMPLETED, id]);
  if (result.rows.length === 0) return null;
  return JobModel.fromRow(result.rows[0]);
}

async function markFailed(id, errorMessage) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const job = await client.query('SELECT * FROM ingestion_jobs WHERE id = $1 FOR UPDATE', [id]);
    if (job.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const row = job.rows[0];
    const shouldRetry = row.attempts < row.max_attempts;
    const nextStatus = shouldRetry ? JOB_STATUS.PENDING : JOB_STATUS.FAILED;

    const sql = `
      UPDATE ingestion_jobs
      SET status = $1, error_message = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    const result = await client.query(sql, [nextStatus, errorMessage, id]);
    await client.query('COMMIT');
    return JobModel.fromRow(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function cancel(id) {
  const sql = `
    UPDATE ingestion_jobs
    SET status = $1, updated_at = NOW()
    WHERE id = $2 AND status NOT IN ($3, $4)
    RETURNING *
  `;
  const result = await query(sql, [JOB_STATUS.CANCELLED, id, JOB_STATUS.COMPLETED, JOB_STATUS.CANCELLED]);
  if (result.rows.length === 0) return null;
  return JobModel.fromRow(result.rows[0]);
}

async function getStats() {
  const sql = `
    SELECT status, COUNT(*)::int AS count
    FROM ingestion_jobs
    GROUP BY status
  `;
  const result = await query(sql);
  const stats = { pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 };
  result.rows.forEach((row) => { stats[row.status] = row.count; });
  return stats;
}

async function resetStaleJobs(staleDurationMinutes = 30) {
  const sql = `
    UPDATE ingestion_jobs
    SET status = $1, updated_at = NOW()
    WHERE status = $2
      AND started_at < NOW() - INTERVAL '1 minute' * $3
    RETURNING id
  `;
  const result = await query(sql, [JOB_STATUS.PENDING, JOB_STATUS.PROCESSING, staleDurationMinutes]);
  return result.rows.map((r) => r.id);
}

module.exports = {
  create,
  findById,
  findByDocumentId,
  claimNextJob,
  markCompleted,
  markFailed,
  cancel,
  getStats,
  resetStaleJobs,
};
