# RAG Engine — Legacy Code Analyzer

## Overview

This module implements the **Retrieval-Augmented Generation (RAG) engine** for a distributed legacy code analysis system.

The objective is to:

* Ingest large legacy codebases
* Parse and semantically chunk source files
* Generate embeddings for code snippets
* Store embeddings in a vector database
* Retrieve relevant code sections for user queries
* Generate grounded answers using an LLM

This service operates independently and is consumed by the API Gateway via HTTP.

---

# Problem Context

Legacy codebases suffer from:

* Poor documentation
* Deeply nested dependencies
* Unclear architectural boundaries
* Obsolete patterns

Traditional search tools (e.g., grep) fail for semantic queries such as:

* “Where is authentication handled?”
* “How is session validation implemented?”
* “Where are database connections initialized?”

This RAG engine enables **semantic understanding of code**, not just keyword matching.

---

# System Architecture (RAG Engine)

```
Code Repository
       ↓
Parser & Chunker
       ↓
Embedding Generator
       ↓
Vector Database
       ↓
Retriever (Top-K Similar Chunks)
       ↓
LLM Generator
       ↓
Grounded Response
```

---

# Core Components

## 1. Ingestion Module

Location:

```
rag_engine/ingestion/
```

### Responsibilities:

* Accept local repository path
* Recursively scan source files
* Parse supported languages
* Extract:

  * File-level chunks
  * Function-level chunks
  * Class-level chunks
* Apply overlapping token-based chunking

### Metadata Stored:

* file_path
* language
* function_name (if applicable)
* class_name (if applicable)
* repository_name
* line_range

---

## 2. Embedding Module

Location:

```
rag_engine/embeddings/
```

### Responsibilities:

* Convert code chunks into vector embeddings
* Store embeddings in vector database
* Support batch processing
* Allow embedding model switching via config

### Supported Models (Configurable):

* BGE-large
* CodeBERT
* OpenAI Embeddings

All model configurations are defined in:

```
model_config.yaml
```

---

## 3. Vector Store

Supported backends:

* Chroma (default)
* FAISS (optional)

Stored data:

* Embedding vectors
* Metadata
* Raw code chunk

---

## 4. Retrieval Module

Location:

```
rag_engine/retrieval/
```

### Steps:

1. Embed user query
2. Retrieve top-k most similar code chunks
3. Apply similarity threshold
4. Optional re-ranking

### Metrics Implemented:

* Precision@K
* Recall@K
* MRR (Mean Reciprocal Rank)

---

## 5. Generation Module

Location:

```
rag_engine/generation/
```

### Process:

* Inject retrieved code snippets into prompt template
* Pass structured prompt to LLM
* Generate grounded explanation

Prompt template:

```
You are a senior software engineer.

Based on the following code snippets:
{retrieved_chunks}

Answer the question:
{user_question}

If the answer is not present in the snippets, say so explicitly.
```

---

# RAG Pipeline

Entry point:

```
pipelines/rag_pipeline.py
```

Pipeline stages:

1. Ingestion (offline)
2. Embedding creation (offline)
3. Query-time retrieval
4. LLM generation

---

# API Interface

The RAG engine exposes a FastAPI service.

### Endpoint: POST /query

Request:

```
{
  "question": "Where is authentication implemented?",
  "top_k": 5
}
```

Response:

```
{
  "answer": "...",
  "sources": [
    {
      "file_path": "...",
      "line_range": "...",
      "similarity_score": 0.82
    }
  ]
}
```

---

# Docker Deployment

Dockerfile is located in:

```
rag_engine/Dockerfile
```

Build:

```
docker build -t rag-engine .
```

Run:

```
docker run -p 8001:8001 rag-engine
```

Service runs independently and communicates via HTTP with API Gateway.

---

# Configuration

All configurable parameters:

* Embedding model
* LLM model
* Chunk size
* Chunk overlap
* Top-K retrieval
* Similarity threshold

Stored in:

```
llm_config.yaml
model_config.yaml
```

---

# Evaluation Strategy

## 1. Retrieval Evaluation

Manually curated query set:

* 15–20 domain-specific questions
* Known ground-truth file references

Metrics computed:

* Precision@K
* Recall@K
* MRR

---

## 2. Ablation Study

Experiments conducted:

* Without RAG (LLM only)
* Small chunks vs semantic chunks
* Different embedding models
* Different K values

---

## 3. Latency Analysis

Measured:

* Embedding time
* Retrieval time
* Generation time
* Total query response time