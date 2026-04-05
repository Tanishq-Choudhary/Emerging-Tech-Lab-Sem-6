# CodeAtlas Architecture

CodeAtlas is a distributed semantic search engine designed to analyze legacy codebases. It is built using a microservices architecture deployed on Kubernetes, allowing each component to scale independently based on workload.

## System Overview

The system consists of two main ownership boundaries:
1. **Platform & Ingestion (Tanishq Choudhary)** - API Gateway, async processing pipeline, storage layer, and infrastructure.
2. **RAG Engine (Divyanshu)** - Model embeddings, vector database, and LLM generation.

This document describes the Platform & Ingestion side.

## Core Services

### API Gateway (Node.js/Express)
The entry point for all client requests.
- **Responsibilities:** Routing, rate limiting (100 req/min), CORS, payload validation, file uploads (multipart/form-data), and request proxying to the RAG engine.
- **Port:** 3000
- **Key Middleware:** Custom token bucket rate limiter, XSS sanitization, structured JSON request logging, and Prometheus-style metrics collection.

### Ingestion Service (Node.js Worker)
An asynchronous worker that processes uploaded repositories into semantic chunks.
- **Responsibilities:** Polling the job queue, detecting programming languages, parsing source files (extracting functions/classes), chunking with token overlap, and database persistence.
- **Concurrency:** Uses PostgreSQL `FOR UPDATE SKIP LOCKED` for safe concurrent job claiming.
- **Resilience:** Includes a stale job checker that resets jobs stuck in "processing" state for too long.

### PostgreSQL Database
The central source of truth for metadata and job orchestration.
- **Tables:**
  - `documents`: Stores file metadata, checksums (for deduplication), and language info.
  - `ingestion_jobs`: Tracks state (pending -> processing -> completed/failed) with retry limits.
  - `chunk_metadata`: Stores the actual code chunks parsed from files, mapping them back to their origin documents.

## Request Flows

### 1. Document Upload
1. Client sends `POST /api/documents/upload` with files.
2. Gateway writes files to a shared volume (`/app/uploads`).
3. (Future step): Client triggers a repository ingestion via a job creation endpoint.

### 2. Async Processing (Worker Loop)
1. Worker polls `ingestion_jobs` table for `status = 'pending'`.
2. Worker locks job row, changes status to `processing`.
3. Discovers files in the upload directory.
4. For each file: compute checksum (skip if dup), detect language, extract AST elements via regex heuristics, apply token-based chunking with overlap.
5. Save chunks to `chunk_metadata`.
6. Update job status to `completed` or `failed`.

### 3. Querying
1. Client sends `POST /api/query` with `{ "question": "..." }`.
2. Gateway sanitizes input and forwards payload via HTTP Native Module to the RAG Engine service at `http://rag-engine:8001/query`.
3. Result returned to client.

## Infrastructure
All services are containerized and deployed via Kubernetes. Stateful data (Postgres) uses PersistentVolumeClaims. Services communicate securely within the cluster via ClusterIPs.

## Code Visualizer

An interactive force-directed graph of your ingested codebase — files, classes, and functions as nodes with edges showing containment relationships.

### How it works

The RAG engine exposes a `GET /graph` endpoint that queries `chunk_metadata` and `documents` from PostgreSQL and returns a node/edge graph. The Control Center UI renders this with [vis-network](https://visjs.github.io/vis-network/).

### Usage

1. Upload and ingest files via the Control Center
2. Scroll to the **Code Graph** panel
3. Optionally filter by repository name
4. Click **Load Graph**

### Node types

| Color | Type | Description |
|-------|------|-------------|
| Blue | File | Source file / document |
| Pink | Class | Parsed class definition |
| Purple | Function | Parsed function or method |

### Layout options

- **Physics (force-directed)** — organic clustering, good for exploring large codebases
- **Hierarchical (top-down)** — structured tree view, good for seeing file → class → function hierarchy

### Endpoint

```
GET http://localhost:8001/graph?repository=<name>
```

`repository` is optional. Returns `{ nodes, edges, stats }`.

### Requirements

- RAG engine must be running with port `8001` exposed (see `docker-compose.yml`)
- Files must be ingested before the graph will populate
