const path = require('path');
// Ingestion worker that polls for pending jobs and processes them
const logger = require('codeatlas-shared/src/logger');
const jobRepo = require('./repository/job.repo');
const { processDirectory } = require('./pipeline/processor');
const { shutdown } = require('codeatlas-shared/src/db/pool');

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL, 10) || 5000;
const STALE_CHECK_INTERVAL = parseInt(process.env.STALE_CHECK_INTERVAL, 10) || 60000;

let running = true;

async function processNextJob() {
  const job = await jobRepo.claimNextJob();
  if (!job) return false;

  logger.info('Processing job', { jobId: job.id, documentId: job.documentId });

  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const document = await require('../repository/document.repo').findById(job.documentId);
    if (!document) throw new Error('Document not found');

    const filePath = path.join(uploadDir, document.filename);
    const results = await require('../pipeline/processor').processFile(filePath, document.repositoryName, job.id, document.id);

    await jobRepo.markCompleted(job.id);
    logger.info('Job completed', { jobId: job.id, documentId: job.documentId });
  } catch (err) {
    logger.error('Job failed', { jobId: job.id, error: err.message });
    await jobRepo.markFailed(job.id, err.message);
  }

  return true;
}

async function pollLoop() {
  while (running) {
    try {
      const processed = await processNextJob();
      if (!processed) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      }
    } catch (err) {
      logger.error('Poll error', { error: err.message });
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }
  }
}

async function staleJobChecker() {
  while (running) {
    try {
      const resetIds = await jobRepo.resetStaleJobs();
      if (resetIds.length > 0) {
        logger.warn('Reset stale jobs', { count: resetIds.length, ids: resetIds });
      }
    } catch (err) {
      logger.error('Stale check error', { error: err.message });
    }
    await new Promise((resolve) => setTimeout(resolve, STALE_CHECK_INTERVAL));
  }
}

function stop() {
  logger.info('Ingestion worker shutting down');
  running = false;
}

async function start() {
  logger.info('Ingestion worker started', { pollInterval: POLL_INTERVAL });
  pollLoop();
  staleJobChecker();
}

process.on('SIGTERM', async () => {
  stop();
  await shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  stop();
  await shutdown();
  process.exit(0);
});

if (require.main === module) {
  start();
}

module.exports = { start, stop };
