// Ingestion job data model
const { JOB_STATUS } = require('codeatlas-shared/src/constants');

class JobModel {
  constructor(row) {
    this.id = row.id;
    this.documentId = row.document_id;
    this.status = row.status;
    this.priority = row.priority;
    this.attempts = row.attempts;
    this.maxAttempts = row.max_attempts;
    this.errorMessage = row.error_message;
    this.startedAt = row.started_at;
    this.completedAt = row.completed_at;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  static fromRow(row) {
    return new JobModel(row);
  }

  get isRetryable() {
    return this.status === JOB_STATUS.FAILED && this.attempts < this.maxAttempts;
  }

  get isTerminal() {
    return this.status === JOB_STATUS.COMPLETED || this.status === JOB_STATUS.CANCELLED;
  }

  toJSON() {
    return {
      id: this.id,
      documentId: this.documentId,
      status: this.status,
      priority: this.priority,
      attempts: this.attempts,
      maxAttempts: this.maxAttempts,
      errorMessage: this.errorMessage,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = JobModel;
