// Job management and status tracking routes
const { Router } = require('express');
const { query } = require('codeatlas-shared/src/db/pool');
const { JOB_STATUS } = require('codeatlas-shared/src/constants');

const router = Router();

function mapJobRow(row) {
  return {
    id: row.id,
    documentId: row.document_id,
    status: row.status,
    priority: row.priority,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    errorMessage: row.error_message,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const sql = 'SELECT status, COUNT(*)::int AS count FROM ingestion_jobs GROUP BY status';
    const result = await query(sql);
    const stats = { pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 };
    result.rows.forEach((row) => { stats[row.status] = row.count; });
    res.json({ stats });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM ingestion_jobs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(mapJobRow(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

router.get('/document/:documentId', async (req, res, next) => {
  try {
    const sql = 'SELECT * FROM ingestion_jobs WHERE document_id = $1 ORDER BY created_at DESC';
    const result = await query(sql, [req.params.documentId]);
    res.json({ jobs: result.rows.map(mapJobRow) });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/cancel', async (req, res, next) => {
  try {
    const sql = `
      UPDATE ingestion_jobs
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND status NOT IN ($3, $4)
      RETURNING *
    `;
    const result = await query(sql, [JOB_STATUS.CANCELLED, req.params.id, JOB_STATUS.COMPLETED, JOB_STATUS.CANCELLED]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found or already terminal' });
    }
    res.json(mapJobRow(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
