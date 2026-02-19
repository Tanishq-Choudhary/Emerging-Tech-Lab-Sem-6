// Document upload routes with multipart handling
const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const config = require('../config');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = config.upload.dest;
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: config.upload.maxFiles,
  },
});

const router = Router();

router.post('/upload', upload.array('files', config.upload.maxFiles), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const { query } = require('codeatlas-shared/src/db/pool');

    const repositoryName = req.body.repository || 'default';
    const results = [];

    for (const file of req.files) {
      // 1. Calculate real checksum
      const fileContent = fs.readFileSync(file.path);
      const checksum = crypto.createHash('sha256').update(fileContent).digest('hex');

      // 2. Insert into documents table
      const docSql = `
        INSERT INTO documents (filename, original_path, mime_type, size_bytes, repository_name, checksum)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      const docResult = await query(docSql, [
        file.filename,
        file.originalname,
        file.mimetype,
        file.size,
        repositoryName,
        checksum
      ]);
      const documentId = docResult.rows[0].id;

      // 2. Insert into ingestion_jobs table
      const jobSql = `
        INSERT INTO ingestion_jobs (document_id, status, priority)
        VALUES ($1, 'pending', 1)
        RETURNING id
      `;
      const jobResult = await query(jobSql, [documentId]);

      results.push({
        documentId,
        jobId: jobResult.rows[0].id,
        originalName: file.originalname,
        storedAs: file.filename,
        size: file.size,
        mimeType: file.mimetype,
        repository: repositoryName,
      });
    }

    res.status(201).json({
      message: `${results.length} file(s) uploaded and queued for ingestion successfully`,
      files: results,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { query } = require('codeatlas-shared/src/db/pool');
    const result = await query('SELECT * FROM documents ORDER BY uploaded_at DESC LIMIT 50');
    res.json({ documents: result.rows, total: result.rowCount });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/chunks', async (req, res, next) => {
  try {
    const { query } = require('codeatlas-shared/src/db/pool');
    const result = await query(
      'SELECT * FROM chunk_metadata WHERE document_id = $1 ORDER BY chunk_index ASC',
      [req.params.id]
    );
    res.json({ chunks: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
