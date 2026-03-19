// API gateway configuration
const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  env: process.env.NODE_ENV || 'development',

  upload: {
    dest: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024,
    maxFiles: parseInt(process.env.MAX_FILES, 10) || 50,
  },

  ragEngine: {
    baseUrl: process.env.RAG_ENGINE_URL,
    timeout: parseInt(process.env.RAG_TIMEOUT, 10) || 30000,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
};

module.exports = config;
