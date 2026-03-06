// Express application setup and middleware registration
const express = require('express');
const cors = require('cors');
const config = require('./config');
const errorHandler = require('./middleware/error-handler');
const metrics = require('codeatlas-shared/src/metrics');
const logger = require('codeatlas-shared/src/logger');
const healthRoutes = require('./routes/health.routes');
const uploadRoutes = require('./routes/upload.routes');
const jobsRoutes = require('./routes/jobs.routes');
const queryRoutes = require('./routes/query.routes');

const app = express();

app.use(cors(config.cors));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(logger.requestLogger());
app.use(metrics.requestTimer());

app.use('/api/health', healthRoutes);
app.use('/api/documents', uploadRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/query', queryRoutes);

app.use(errorHandler);

module.exports = app;
