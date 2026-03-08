// Document processing pipeline that coordinates parsing, chunking, and storage
const fs = require('fs').promises;
const crypto = require('crypto');
const { detectLanguage, isSupported, extractFunctions, extractClasses } = require('./parser');
const { createChunks } = require('./chunker');
const documentRepo = require('../repository/document.repo');
const jobRepo = require('../repository/job.repo');
const { query } = require('codeatlas-shared/src/db/pool');

async function computeChecksum(filePath) {
  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function processFile(filePath, repositoryName, jobId, documentId) {
  const content = await fs.readFile(filePath, 'utf-8');
  const language = detectLanguage(filePath);

  // Update document language if detected
  if (language) {
    await documentRepo.updateLanguage(documentId, language);
  }

  const functions = language ? extractFunctions(content, language) : [];
  const classes = language ? extractClasses(content, language) : [];
  const chunks = createChunks(content, functions, classes);

  for (const chunk of chunks) {
    await query(
      `INSERT INTO chunk_metadata
        (document_id, job_id, chunk_index, content, start_line, end_line, token_count, chunk_type, function_name, class_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        documentId,
        jobId,
        chunk.chunkIndex,
        chunk.content,
        chunk.startLine,
        chunk.endLine,
        chunk.tokenCount,
        chunk.chunkType,
        chunk.functionName || null,
        chunk.className || null,
      ],
    );
  }

  return {
    skipped: false,
    documentId: documentId,
    chunksCreated: chunks.length,
    language,
  };
}

async function processDirectory(dirPath, repositoryName, jobId) {
  const results = { processed: 0, skipped: 0, failed: 0, errors: [] };
  const entries = await fs.readdir(dirPath, { withFileTypes: true, recursive: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const fullPath = `${entry.parentPath || entry.path}/${entry.name}`;
    if (!isSupported(fullPath)) continue;

    try {
      const result = await processFile(fullPath, repositoryName, jobId);
      if (result.skipped) {
        results.skipped++;
      } else {
        results.processed++;
      }
    } catch (err) {
      results.failed++;
      results.errors.push({ file: fullPath, error: err.message });
    }
  }

  return results;
}

module.exports = { processFile, processDirectory, computeChecksum };
