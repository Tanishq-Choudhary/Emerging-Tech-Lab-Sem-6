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

    const repositoryName = req.body.repository || 'default';
    const results = req.files.map((file) => ({
      originalName: file.originalname,
      storedAs: file.filename,
      size: file.size,
      mimeType: file.mimetype,
      repository: repositoryName,
    }));

    res.status(201).json({
      message: `${results.length} file(s) uploaded successfully`,
      files: results,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    res.json({ documents: [], total: 0 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
