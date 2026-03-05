// Parser unit tests
const assert = require('node:assert');
const { describe, it } = require('node:test');
const { detectLanguage, isSupported, extractFunctions } = require('../src/pipeline/parser');

describe('detectLanguage', () => {
  it('should detect JavaScript files', () => {
    assert.strictEqual(detectLanguage('app.js'), 'javascript');
    assert.strictEqual(detectLanguage('component.jsx'), 'javascript');
  });

  it('should detect Python files', () => {
    assert.strictEqual(detectLanguage('main.py'), 'python');
  });

  it('should detect TypeScript files', () => {
    assert.strictEqual(detectLanguage('index.ts'), 'typescript');
    assert.strictEqual(detectLanguage('App.tsx'), 'typescript');
  });

  it('should return null for unknown extensions', () => {
    assert.strictEqual(detectLanguage('readme.md'), null);
    assert.strictEqual(detectLanguage('data.json'), null);
  });
});

describe('isSupported', () => {
  it('should accept supported file types', () => {
    assert.strictEqual(isSupported('file.js'), true);
    assert.strictEqual(isSupported('file.py'), true);
    assert.strictEqual(isSupported('file.java'), true);
    assert.strictEqual(isSupported('file.go'), true);
  });

  it('should reject unsupported file types', () => {
    assert.strictEqual(isSupported('file.md'), false);
    assert.strictEqual(isSupported('file.json'), false);
    assert.strictEqual(isSupported('file.txt'), false);
  });
});

describe('extractFunctions', () => {
  it('should extract JavaScript functions', () => {
    const code = [
      'function add(a, b) {',
      '  return a + b;',
      '}',
      '',
      'const multiply = (a, b) => {',
      '  return a * b;',
      '};',
    ].join('\n');

    const functions = extractFunctions(code, 'javascript');
    assert.ok(functions.length >= 1);
    assert.strictEqual(functions[0].name, 'add');
  });

  it('should return empty array for unknown languages', () => {
    const functions = extractFunctions('some code', 'brainfuck');
    assert.strictEqual(functions.length, 0);
  });
});
