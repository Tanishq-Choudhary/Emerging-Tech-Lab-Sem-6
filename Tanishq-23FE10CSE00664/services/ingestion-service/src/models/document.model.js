// Document data model for database operations
class DocumentModel {
  constructor(row) {
    this.id = row.id;
    this.filename = row.filename;
    this.originalPath = row.original_path;
    this.mimeType = row.mime_type;
    this.sizeBytes = row.size_bytes;
    this.language = row.language;
    this.repositoryName = row.repository_name;
    this.checksum = row.checksum;
    this.uploadedAt = row.uploaded_at;
    this.updatedAt = row.updated_at;
  }

  static fromRow(row) {
    return new DocumentModel(row);
  }

  toJSON() {
    return {
      id: this.id,
      filename: this.filename,
      originalPath: this.originalPath,
      mimeType: this.mimeType,
      sizeBytes: this.sizeBytes,
      language: this.language,
      repositoryName: this.repositoryName,
      checksum: this.checksum,
      uploadedAt: this.uploadedAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = DocumentModel;
