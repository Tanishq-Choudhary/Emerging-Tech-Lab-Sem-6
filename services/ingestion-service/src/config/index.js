// Ingestion service configuration
const config = {
  pollInterval: parseInt(process.env.POLL_INTERVAL, 10) || 5000,
  staleCheckInterval: parseInt(process.env.STALE_CHECK_INTERVAL, 10) || 60000,
  staleTimeout: parseInt(process.env.STALE_TIMEOUT_MINUTES, 10) || 30,
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS, 10) || 1,

  chunking: {
    maxTokens: parseInt(process.env.CHUNK_MAX_TOKENS, 10) || 512,
    overlapTokens: parseInt(process.env.CHUNK_OVERLAP, 10) || 64,
    minChunkLines: parseInt(process.env.CHUNK_MIN_LINES, 10) || 5,
  },
};

module.exports = config;
