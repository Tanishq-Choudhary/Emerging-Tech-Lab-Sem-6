// Job model unit tests
const assert = require('node:assert');
const { describe, it } = require('node:test');

describe('JobModel', () => {
  it('should construct from a database row', () => {
    const JobModel = require('../src/models/job.model');
    const row = {
      id: '00000000-0000-0000-0000-000000000001',
      document_id: '00000000-0000-0000-0000-000000000002',
      status: 'pending',
      priority: 0,
      attempts: 0,
      max_attempts: 3,
      error_message: null,
      started_at: null,
      completed_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const job = JobModel.fromRow(row);
    assert.strictEqual(job.id, row.id);
    assert.strictEqual(job.documentId, row.document_id);
    assert.strictEqual(job.status, 'pending');
  });

  it('should identify retryable jobs', () => {
    const JobModel = require('../src/models/job.model');
    const failedJob = JobModel.fromRow({
      id: 'id1', document_id: 'did1', status: 'failed',
      priority: 0, attempts: 1, max_attempts: 3,
      error_message: 'timeout', started_at: null,
      completed_at: null, created_at: new Date(), updated_at: new Date(),
    });
    assert.strictEqual(failedJob.isRetryable, true);

    const exhaustedJob = JobModel.fromRow({
      id: 'id2', document_id: 'did2', status: 'failed',
      priority: 0, attempts: 3, max_attempts: 3,
      error_message: 'timeout', started_at: null,
      completed_at: null, created_at: new Date(), updated_at: new Date(),
    });
    assert.strictEqual(exhaustedJob.isRetryable, false);
  });

  it('should identify terminal states', () => {
    const JobModel = require('../src/models/job.model');
    const completed = JobModel.fromRow({
      id: 'id3', document_id: 'did3', status: 'completed',
      priority: 0, attempts: 1, max_attempts: 3,
      error_message: null, started_at: new Date(),
      completed_at: new Date(), created_at: new Date(), updated_at: new Date(),
    });
    assert.strictEqual(completed.isTerminal, true);

    const pending = JobModel.fromRow({
      id: 'id4', document_id: 'did4', status: 'pending',
      priority: 0, attempts: 0, max_attempts: 3,
      error_message: null, started_at: null,
      completed_at: null, created_at: new Date(), updated_at: new Date(),
    });
    assert.strictEqual(pending.isTerminal, false);
  });

  it('should serialize to JSON properly', () => {
    const JobModel = require('../src/models/job.model');
    const row = {
      id: 'id5', document_id: 'did5', status: 'processing',
      priority: 5, attempts: 1, max_attempts: 3,
      error_message: null, started_at: new Date(),
      completed_at: null, created_at: new Date(), updated_at: new Date(),
    };
    const job = JobModel.fromRow(row);
    const json = job.toJSON();
    assert.strictEqual(json.id, 'id5');
    assert.strictEqual(json.priority, 5);
    assert.ok(!json.hasOwnProperty('document_id'));
    assert.ok(json.hasOwnProperty('documentId'));
  });
});
