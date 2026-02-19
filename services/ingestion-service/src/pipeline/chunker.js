// Token-based chunker with configurable overlap for code content
const { CHUNK_CONFIG, CHUNK_TYPE } = require('codeatlas-shared/src/constants');

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function chunkByTokens(content, options = {}) {
  const maxTokens = options.maxTokens || CHUNK_CONFIG.MAX_TOKENS;
  const overlapTokens = options.overlapTokens || CHUNK_CONFIG.OVERLAP_TOKENS;
  const minLines = options.minLines || CHUNK_CONFIG.MIN_CHUNK_LINES;

  const lines = content.split('\n');
  const chunks = [];
  let currentChunk = [];
  let currentTokens = 0;
  let startLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const lineTokens = estimateTokens(lines[i]);

    if (currentTokens + lineTokens > maxTokens && currentChunk.length >= minLines) {
      chunks.push({
        content: currentChunk.join('\n'),
        startLine,
        endLine: startLine + currentChunk.length - 1,
        tokenCount: currentTokens,
        chunkType: CHUNK_TYPE.RAW,
      });

      const overlapLines = [];
      let overlapCount = 0;
      for (let j = currentChunk.length - 1; j >= 0 && overlapCount < overlapTokens; j--) {
        overlapLines.unshift(currentChunk[j]);
        overlapCount += estimateTokens(currentChunk[j]);
      }

      startLine = startLine + currentChunk.length - overlapLines.length;
      currentChunk = [...overlapLines];
      currentTokens = overlapCount;
    }

    currentChunk.push(lines[i]);
    currentTokens += lineTokens;
  }

  if (currentChunk.length > 0) {
    chunks.push({
      content: currentChunk.join('\n'),
      startLine,
      endLine: startLine + currentChunk.length - 1,
      tokenCount: currentTokens,
      chunkType: CHUNK_TYPE.RAW,
    });
  }

  return chunks;
}

function chunkByFunctions(functions) {
  return functions.map((fn) => ({
    content: fn.content,
    startLine: fn.startLine,
    endLine: fn.endLine,
    tokenCount: estimateTokens(fn.content),
    chunkType: CHUNK_TYPE.FUNCTION,
    functionName: fn.name,
  }));
}

function chunkByClasses(classes) {
  return classes.map((cls) => ({
    content: cls.content,
    startLine: cls.startLine,
    endLine: cls.endLine,
    tokenCount: estimateTokens(cls.content),
    chunkType: CHUNK_TYPE.CLASS,
    className: cls.name,
  }));
}

function createChunks(content, functions, classes, options = {}) {
  const rawChunks = chunkByTokens(content, options);
  const fnChunks = chunkByFunctions(functions);
  const classChunks = chunkByClasses(classes);

  const allChunks = [...rawChunks, ...fnChunks, ...classChunks];

  return allChunks.map((chunk, index) => ({
    ...chunk,
    chunkIndex: index,
  }));
}

module.exports = { chunkByTokens, chunkByFunctions, chunkByClasses, createChunks, estimateTokens };
