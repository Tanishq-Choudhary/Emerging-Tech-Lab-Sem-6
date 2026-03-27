# CodeAtlas
## RAG Engine - Divyanshu (23FE10CSE00063)

This repository contains the RAG (Retrieval-Augmented Generation) engine for
CodeAtlas - a distributed semantic search system for legacy codebases.
I own the embedding, vector search, and LLM answer generation layer.

---

## My Ownership Areas
- PostgreSQL chunk reader (reads from shared DB)
- BAAI/bge-base-en-v1.5 embedding pipeline
- ChromaDB vector store (persistent, cosine similarity)
- Similarity filtering and result re-ranking
- HuggingFace LLM answer generation
- FastAPI service (POST /query, GET /health, POST /index)
- Docker containerization
- Kubernetes deployment manifests
- Unit + integration test suite

---

## Commit 1 — Jan 26, 2026
- Defined RAG engine scope, ownership, and API contract in documentation
- Architecture agreed with teammate — microservices + RAG + Kubernetes
- Responsibilities clearly split: Platform & Ingestion (Tanishq) vs RAG Engine (Divyanshu)

## Commit 2 — Feb 16, 2026
- Scaffolded `services/rag-engine/` directory and project structure
- Created `requirements.txt` with FastAPI, sentence-transformers, ChromaDB, psycopg2
- Added `.env.example` with all configurable environment variables
- Added Dockerfile placeholder and `.gitignore`

## Commit 3 — Feb 17, 2026
- Implemented PostgreSQL connection pool using psycopg2 `ThreadedConnectionPool`
- Built `chunk_reader.py` — reads pre-processed chunks from `chunk_metadata` table
- Implemented incremental sync via `last_sync_time` parameter
- Defined `ChunkRecord` dataclass for type-safe DB row mapping

## Commit 4 — Feb 18, 2026
- Integrated `BAAI/bge-base-en-v1.5` embedding model via sentence-transformers
- Implemented BGE prefix strategy for queries and documents
- Built batch embedding support with context-enriched document strings
- Added `chunk_record_to_dict` utility to decouple DB and embedding layers

## Commit 5 — Feb 19, 2026
- Set up ChromaDB persistent vector store with cosine similarity metric
- Implemented `upsert_chunks()` for safe incremental indexing without duplicates
- Implemented `similarity_search()` with distance-to-score conversion (0–1 scale)
- Added `reset_collection()` utility for clean demo resets

## Commit 6 — Feb 21, 2026
- Built full indexing pipeline: Postgres → embed → ChromaDB
- Full reindex on startup, incremental sync every 60 seconds
- Shared `indexer_state` dict for cross-module status visibility
- Fault-tolerant polling loop — DB errors logged and retried, never crash

## Commit 7 — Feb 22, 2026
- Implemented LLM answer generation via HuggingFace Inference API
- Prompt engineering with file paths and line numbers for grounded answers
- temperature=0.2 for factual, deterministic responses
- Graceful fallback to top chunk text when LLM is unavailable

## Commit 8 — Feb 26, 2026
- Scaffolded FastAPI app with lifespan context manager
- Implemented `GET /health` with deep Postgres + ChromaDB connectivity checks
- `POST /query` stub returning 501
- Background indexer starts as daemon thread on app startup

## Commit 9 — Feb 27, 2026
- Wired full RAG pipeline into `POST /query`
- embed → vector search → threshold filter → LLM generation → response
- Returns exact API contract format defined in rag-integration-guide
- Empty vector store handled gracefully with informative message

## Commit 10 — Feb 28, 2026
- Multi-stage Dockerfile: builder installs deps, final image is lean
- BGE model pre-downloaded at build time for instant container startup
- Added `rag-engine` service to `docker-compose.dev.yml`
- Added `.dockerignore` to keep image size minimal

## Commit 11 — Mar 1, 2026
- Kubernetes Deployment manifest with liveness + readiness probes on `/health`
- Kubernetes ClusterIP Service named `rag-engine` on port 8001
- PersistentVolumeClaim (2Gi) for ChromaDB storage across pod restarts

## Commit 12 — Mar 2, 2026
- Pydantic field validators for blank/whitespace question rejection
- Global exception handlers for HTTP errors, validation errors, unhandled exceptions
- Input sanitizer strips dangerous characters before LLM prompt injection
- All error responses return consistent JSON shape

## Commit 13 — Mar 4, 2026
- Extracted reranker module with threshold filtering, deduplication, and score boosting
- Fetch 2x top_k from ChromaDB before filtering to ensure enough survivors
- Named function/class chunks boosted +0.05 for richer LLM context
- Pipeline now passes ranked, deduplicated context to LLM

## Commit 14 — Mar 5, 2026
- Unit tests for embedding pipeline: dimension check, prefix strategy, batch handling
- Unit tests for chunk reader: field mapping, empty results, incremental sync
- All DB dependencies fully mocked — tests run without Postgres
- 12 tests, all passing

## Commit 15 — Mar 6, 2026
- Integration tests for `POST /query`: happy path, empty results, top_k passthrough
- Validation tests: short question, missing field, top_k out of range → 422
- Error handling test: pipeline crash → 500
- Health endpoint field coverage tests
- 24 tests total, all passing

## Commit 16 — Mar 7, 2026
- JSON structured logger with service-name tagging across all modules
- HTTP request middleware logs method, path, status code, duration_ms per request
- Replaced all print() calls with structured logger.info() / logger.error()
- Log format matches Tanishq's Node.js services for unified Kubernetes log aggregation

## Commit 17 — Mar 8, 2026
- `POST /index?full=false` endpoint for manual re-indexing on demand
- Runs in background thread — HTTP response returns instantly
- 409 Conflict if indexing already in progress
- Essential for demo: upload code → trigger index → query immediately

## Commit 18 — Mar 9, 2026
- Finalized `services/rag-engine/README.md` with full setup, env vars, API docs
- Created commit log README
- Verified E2E integration: Gateway → RAG Engine → ChromaDB → LLM → response
- Project complete and production-ready for Kubernetes deployment