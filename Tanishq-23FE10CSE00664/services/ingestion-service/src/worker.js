// Ingestion worker that polls for pending jobs and processes them
const jobRepo = require('./repository/job.repo');
const { processDirectory } = require('./pipeline/processor');
const { shutdown } = require('codeatlas-shared/src/db/pool');

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL, 10) || 5000;
const STALE_CHECK_INTERVAL = parseInt(process.env.STALE_CHECK_INTERVAL, 10) || 60000;

let running = true;

async function processNextJob() {
  const job = await jobRepo.claimNextJob();
  if (!job) return false;

  process.stdout.write(`Processing job ${job.id} for document ${job.documentId}\n`);

  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const results = await processDirectory(uploadDir, 'default', job.id);
    await jobRepo.markCompleted(job.id);
    process.stdout.write(`Job ${job.id} completed: ${JSON.stringify(results)}\n`);
  } catch (err) {
    process.stderr.write(`Job ${job.id} failed: ${err.message}\n`);
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
      process.stderr.write(`Poll error: ${err.message}\n`);
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }
  }
}

async function staleJobChecker() {
  while (running) {
    try {
      const resetIds = await jobRepo.resetStaleJobs();
      if (resetIds.length > 0) {
        process.stdout.write(`Reset ${resetIds.length} stale job(s)\n`);
      }
    } catch (err) {
      process.stderr.write(`Stale check error: ${err.message}\n`);
    }
    await new Promise((resolve) => setTimeout(resolve, STALE_CHECK_INTERVAL));
  }
}

function stop() {
  process.stdout.write('Ingestion worker shutting down\n');
  running = false;
}

async function start() {
  process.stdout.write('Ingestion worker started\n');
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
