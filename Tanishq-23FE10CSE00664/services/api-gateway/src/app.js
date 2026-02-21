// Express application setup and middleware registration
const express = require('express');
const cors = require('cors');
const config = require('./config');
const healthRoutes = require('./routes/health.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();

app.use(cors(config.cors));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/health', healthRoutes);
app.use('/api/documents', uploadRoutes);

module.exports = app;
