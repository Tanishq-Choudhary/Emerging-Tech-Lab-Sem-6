// Source file parser that detects language and extracts structural elements
const path = require('path');
const { SUPPORTED_EXTENSIONS } = require('codeatlas-shared/src/constants');

const LANGUAGE_MAP = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.java': 'java',
  '.go': 'go',
  '.rb': 'ruby',
  '.php': 'php',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.rs': 'rust',
  '.swift': 'swift',
  '.kt': 'kotlin',
};

function detectLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return LANGUAGE_MAP[ext] || null;
}

function isSupported(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

function extractFunctions(content, language) {
  const functions = [];
  const lines = content.split('\n');

  const patterns = {
    javascript: /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\(|=>))/,
    typescript: /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\(|=>))/,
    python: /^def\s+(\w+)\s*\(/,
    java: /(?:public|private|protected|static|\s)+[\w<>\[\]]+\s+(\w+)\s*\(/,
    go: /^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(/,
  };

  const pattern = patterns[language];
  if (!pattern) return functions;

  let currentFunction = null;
  let braceDepth = 0;
  let indentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(pattern);

    if (match && !currentFunction) {
      const name = match[1] || match[2];
      currentFunction = { name, startLine: i + 1, lines: [line] };
      braceDepth = 0;
      indentStart = line.search(/\S/);
    }

    if (currentFunction) {
      if (i + 1 !== currentFunction.startLine) {
        currentFunction.lines.push(line);
      }

      for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
      }

      const isEndByBrace = braceDepth <= 0 && currentFunction.lines.length > 1 && line.includes('}');

      const isEndByIndent = language === 'python'
        && currentFunction.lines.length > 1
        && line.trim() !== ''
        && line.search(/\S/) <= indentStart
        && !line.trim().startsWith('#');

      if (isEndByBrace || isEndByIndent) {
        currentFunction.endLine = i + 1;
        currentFunction.content = currentFunction.lines.join('\n');
        delete currentFunction.lines;
        functions.push(currentFunction);
        currentFunction = null;
      }
    }
  }

  if (currentFunction) {
    currentFunction.endLine = lines.length;
    currentFunction.content = currentFunction.lines.join('\n');
    delete currentFunction.lines;
    functions.push(currentFunction);
  }

  return functions;
}

function extractClasses(content, language) {
  const classes = [];
  const lines = content.split('\n');

  const patterns = {
    javascript: /class\s+(\w+)/,
    typescript: /class\s+(\w+)/,
    python: /^class\s+(\w+)/,
    java: /(?:public|private|protected)?\s*class\s+(\w+)/,
  };

  const pattern = patterns[language];
  if (!pattern) return classes;

  let currentClass = null;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(pattern);

    if (match && !currentClass) {
      currentClass = { name: match[1], startLine: i + 1, lines: [line] };
      braceDepth = 0;
    }

    if (currentClass) {
      if (i + 1 !== currentClass.startLine) {
        currentClass.lines.push(line);
      }

      for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
      }

      if (braceDepth <= 0 && currentClass.lines.length > 1 && line.includes('}')) {
        currentClass.endLine = i + 1;
        currentClass.content = currentClass.lines.join('\n');
        delete currentClass.lines;
        classes.push(currentClass);
        currentClass = null;
      }
    }
  }

  if (currentClass) {
    currentClass.endLine = lines.length;
    currentClass.content = currentClass.lines.join('\n');
    delete currentClass.lines;
    classes.push(currentClass);
  }

  return classes;
}

module.exports = { detectLanguage, isSupported, extractFunctions, extractClasses };
