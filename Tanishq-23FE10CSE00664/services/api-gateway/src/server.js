// HTTP server entry point
const app = require('./app');
const config = require('./config');
const { shutdown } = require('codeatlas-shared/src/db/pool');

const server = app.listen(config.port, () => {
  process.stdout.write(`API Gateway running on port ${config.port} [${config.env}]\n`);
});

function gracefulShutdown(signal) {
  process.stdout.write(`${signal} received, shutting down gracefully\n`);
  server.close(async () => {
    await shutdown();
    process.exit(0);
  });

  setTimeout(() => {
    process.stderr.write('Forced shutdown after timeout\n');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
