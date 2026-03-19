// Chunker unit tests
const assert = require('node:assert');
const { describe, it } = require('node:test');
const { chunkByTokens, estimateTokens, chunkByFunctions } = require('../src/pipeline/chunker');

describe('estimateTokens', () => {
  it('should estimate tokens based on character count', () => {
    assert.strictEqual(estimateTokens(''), 0);
    assert.strictEqual(estimateTokens('abcd'), 1);
    assert.strictEqual(estimateTokens('a'.repeat(100)), 25);
  });
});

describe('chunkByTokens', () => {
  it('should return a single chunk for short content', () => {
    const content = 'line one\nline two\nline three\nline four\nline five\nline six';
    const chunks = chunkByTokens(content, { maxTokens: 1000 });
    assert.strictEqual(chunks.length, 1);
    assert.strictEqual(chunks[0].startLine, 1);
  });

  it('should split long content into multiple chunks', () => {
    const lines = Array.from({ length: 200 }, (_, i) => `const variable${i} = "${'x'.repeat(20)}";`);
    const content = lines.join('\n');
    const chunks = chunkByTokens(content, { maxTokens: 100, overlapTokens: 10, minLines: 2 });
    assert.ok(chunks.length > 1);

    for (const chunk of chunks) {
      assert.ok(chunk.startLine >= 1);
      assert.ok(chunk.endLine >= chunk.startLine);
      assert.ok(chunk.tokenCount > 0);
    }
  });

  it('should include overlap between chunks', () => {
    const lines = Array.from({ length: 100 }, (_, i) => `line ${i}: ${'content '.repeat(10)}`);
    const content = lines.join('\n');
    const chunks = chunkByTokens(content, { maxTokens: 100, overlapTokens: 20, minLines: 2 });

    if (chunks.length >= 2) {
      assert.ok(chunks[1].startLine <= chunks[0].endLine);
    }
  });
});

describe('chunkByFunctions', () => {
  it('should create chunks from function metadata', () => {
    const functions = [
      { name: 'foo', content: 'function foo() { return 1; }', startLine: 1, endLine: 1 },
      { name: 'bar', content: 'function bar() {\n  return 2;\n}', startLine: 3, endLine: 5 },
    ];
    const chunks = chunkByFunctions(functions);
    assert.strictEqual(chunks.length, 2);
    assert.strictEqual(chunks[0].functionName, 'foo');
    assert.strictEqual(chunks[1].functionName, 'bar');
    assert.strictEqual(chunks[0].chunkType, 'function');
  });
});
