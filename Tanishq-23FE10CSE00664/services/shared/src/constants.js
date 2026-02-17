// Platform-wide constants for CodeAtlas services
const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

const CHUNK_TYPE = {
  RAW: 'raw',
  FUNCTION: 'function',
  CLASS: 'class',
  MODULE: 'module',
};

const SUPPORTED_EXTENSIONS = [
  '.js', '.ts', '.jsx', '.tsx',
  '.py',
  '.java',
  '.go',
  '.rb',
  '.php',
  '.c', '.cpp', '.h', '.hpp',
  '.cs',
  '.rs',
  '.swift',
  '.kt',
];

const CHUNK_CONFIG = {
  MAX_TOKENS: 512,
  OVERLAP_TOKENS: 64,
  MIN_CHUNK_LINES: 5,
};

const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  MAX_FILES_PER_REQUEST: 50,
  ALLOWED_MIME_TYPES: [
    'text/plain',
    'application/octet-stream',
    'application/zip',
    'application/gzip',
    'application/x-tar',
  ],
};

const SERVICE_PORTS = {
  API_GATEWAY: 3000,
  INGESTION_SERVICE: 3001,
  RAG_ENGINE: 8001,
};

module.exports = {
  JOB_STATUS,
  CHUNK_TYPE,
  SUPPORTED_EXTENSIONS,
  CHUNK_CONFIG,
  UPLOAD_LIMITS,
  SERVICE_PORTS,
};
