// Data access layer for the documents table
const { query } = require('codeatlas-shared/src/db/pool');
const DocumentModel = require('../models/document.model');

async function create({ filename, originalPath, mimeType, sizeBytes, language, repositoryName, checksum }) {
  const sql = `
    INSERT INTO documents (filename, original_path, mime_type, size_bytes, language, repository_name, checksum)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const params = [filename, originalPath, mimeType, sizeBytes, language, repositoryName, checksum];
  const result = await query(sql, params);
  return DocumentModel.fromRow(result.rows[0]);
}

async function findById(id) {
  const result = await query('SELECT * FROM documents WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  return DocumentModel.fromRow(result.rows[0]);
}

async function findByRepository(repositoryName, { limit = 50, offset = 0 } = {}) {
  const sql = 'SELECT * FROM documents WHERE repository_name = $1 ORDER BY uploaded_at DESC LIMIT $2 OFFSET $3';
  const result = await query(sql, [repositoryName, limit, offset]);
  return result.rows.map(DocumentModel.fromRow);
}

async function findByChecksum(checksum) {
  const result = await query('SELECT * FROM documents WHERE checksum = $1', [checksum]);
  if (result.rows.length === 0) return null;
  return DocumentModel.fromRow(result.rows[0]);
}

async function updateLanguage(id, language) {
  const sql = 'UPDATE documents SET language = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
  const result = await query(sql, [language, id]);
  if (result.rows.length === 0) return null;
  return DocumentModel.fromRow(result.rows[0]);
}

async function remove(id) {
  const result = await query('DELETE FROM documents WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

async function count(repositoryName) {
  const sql = repositoryName
    ? 'SELECT COUNT(*)::int AS total FROM documents WHERE repository_name = $1'
    : 'SELECT COUNT(*)::int AS total FROM documents';
  const params = repositoryName ? [repositoryName] : [];
  const result = await query(sql, params);
  return result.rows[0].total;
}

module.exports = { create, findById, findByRepository, findByChecksum, updateLanguage, remove, count };
