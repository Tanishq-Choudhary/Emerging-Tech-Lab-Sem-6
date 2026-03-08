# CodeAtlas
## Platform, Infrastructure & Ingestion - Tanishq Choudhary 23FE10CSE00664

This repository contains a distributed semantic search system built using a microservices architecture. The platform supports document uploads, asynchronous ingestion, metadata persistence, and scalable query handling. All services are containerized and designed to run on Kubernetes.

This README reflects the responsibilities and current focus of Tanishq Choudhary - 23FE10CSE00664, who owns the platform, infrastructure, and ingestion side of the system.

---

## What I’m Building

I am responsible for the **core system backbone** that makes the application reliable and scalable. This includes the API entry points, document ingestion pipeline, job orchestration, persistent storage, containerization, and Kubernetes deployment.

The goal is to ensure the system:
- Handles concurrent uploads safely
- Processes documents asynchronously
- Recovers from failures
- Scales horizontally under load

---

## My Ownership Areas

- API Gateway
- Document upload service
- Asynchronous ingestion pipeline
- Job orchestration and status tracking
- PostgreSQL metadata storage
- Dockerization of all services
- Kubernetes manifests and deployments
- Scaling and failure handling (pod restarts, crashes)

---
## Current Status (First Commit) - Jan 26, 2026

- Repository initialized and pushed to GitHub
- Architecture agreed with teammate (microservices + RAG + Kubernetes)
- Responsibilities clearly split between Person A and Person B
- Project scope locked in before implementation

This commit intentionally contains **only documentation** to ensure both contributors start with the same plan and no scope confusion.

---

## Immediate Next Steps 

- Create repo structure for services / infra / docs
- Add base service skeleton folders
- Add initial Docker + Kubernetes placeholders
- Start PostgreSQL schema draft for documents and ingestion jobs

---

## Current Status (Second Commit) - Feb 16, 2026

- Completed the planned Week-1 setup from the first commit
- Repo structure added for `services/`, `infra/`, and `docs/`
- Created skeleton folders for platform-owned services (API gateway, ingestion, infra)
- Added Docker placeholder for local Postgres development
- Added Kubernetes base folder for upcoming manifests
- Added initial Postgres schema draft placeholder file

This commit focuses on turning the agreed architecture into a clean working repository structure so development can begin without merge conflicts.

---

## Immediate Next Steps 

- Implement upload endpoint (API Gateway)
- Add ingestion job queue + job status tracking
- Fill PostgreSQL schema for:
  - documents
  - ingestion_jobs
  - chunk metadata references
- Start Kubernetes base manifests (deployments + services)

---

## Commit 3 - Feb 17, 2026

- Finalized the `services/shared` library logic for CodeAtlas.
- Implemented PostgreSQL schema definitions for `documents`, `ingestion_jobs`, and `chunk_metadata`. 
- Added robust database connection pooling and graceful shutdown handlers to prevent leaky handles.

---

## Commit 4 - Feb 18, 2026

- Developed `DocumentModel` and its repository layer within the `ingestion-service`. 
- Implemented core CRUD operations directly against PostgreSQL using parameterized queries for security.

---

## Commit 5 - Feb 19, 2026

- Created the `JobModel` and repository queues.
- Built a polling-friendly task claim mechanism utilizing `FOR UPDATE SKIP LOCKED` inside Postgres to safely handle concurrent job processing without race conditions.

---

## Commit 6 - Feb 21, 2026

- Stood up the `api-gateway` Express.js server. 
- Integrated Multer to accept and store multipart form-data for legacy file ingestion.
- Added foundational `/api/health` and `/api/documents/upload` REST endpoints.

---

## Commit 7 - Feb 22, 2026

- Built the core heavy-lifting logic inside `ingestion-service`. 
- Added a robust multi-language AST parser that can detect programming languages, extract top-level functions/classes, and chunk remaining code based on overlapping token estimations. 

---

## Commit 8 - Feb 26, 2026

- Integrated job orchestrator to connect the API gateway requests to the background ingestion processors.
- Updated API Gateway to track pending jobs, retrieve individual run statistics, and proxy `/api/query` requests to the upcoming RAG engine.

---

## Commit 9 - Feb 27, 2026

- Added multi-stage builder Dockerfiles for `api-gateway` and `ingestion-service`.
- Created production-ready `docker-compose.yml` and hot-reload enabled `docker-compose.dev.yml` to streamline local development.

---

## Commit 10 - Feb 28, 2026

- Authored base Kubernetes manifests (`.yaml`). 
- Declared dedicated `Namespace`, PersistentVolumeClaims for Postgres limits and shared uploads, and standard Deployments + ClusterIP Services.

---

## Commit 11 - Mar 1, 2026

- Formalized HTTP boundaries globally using centralized error-handling Express middlewares.
- Added strict payload validation pipelines across `api-gateway` endpoints to drop malformed input before further routing occurs.

---

## Commit 12 - Mar 2, 2026

- Built a custom instrumentation module using Prometheus-style metric arrays.
- Wired memory footprint, response durations, and up-times aggressively into `/api/health` so orchestrators (like K8s) can evaluate load distributions effectively.

---

## Commit 13 - Mar 4, 2026

- Added robust test suite inside `api-gateway/tests` using the built-in Node.js v22 test runner.
- Assured error paths, invalid UUID handlers, and multipart edge cases successfully fail/succeed exactly as expected.

---

## Commit 14 - Mar 5, 2026

- Built functional unit test suite over `ingestion-service` isolating its chunking algorithm. 
- Added coverage over code overlap handling to ensure code definitions aren't abnormally severed across vector splits.

---

## Commit 15 - Mar 6, 2026

- Extended `shared` logging interface with a JSON-formatted standard output logger `logger.requestLogger()`.
- Added specific service-name tag associations per trace to track the exact lifecycle of background ingestion tasks over multiple Node processes.

---

## Commit 16 - Mar 7, 2026

- Plugged in critical security headers across gateways (X-Content-Type-Options, X-Frame-Options, STS). 
- Added a custom token bucket rate limiter tracking connecting IPs to guard systems against unbounded job spam.

---
## Commit 17, 18, 19 & 20 - Mar 8-9, 2026

- Refactored ingestion processing logic to use SHA-256 checksums and granular file-level job isolation for production scalability. (Mar 8)
- Developed a professional diagnostic Control Center (`test-ui.html`) to demonstrate the full E2E pipeline visually. (Mar 8)
- Finalized technical documentation, including the `rag-integration-guide.md` and a comprehensive `demo-guide.md` for evaluation. (Mar 9)
- Hardened platform security headers, rate limiting, and standard `.gitignore` configurations. (Mar 9)
- Refactored all services and infrastructure (Docker & Kubernetes) to use 100% environment variable isolation, removing hardcoded credentials and hostnames. (Mar 9)
- Successfully verified the platform can ingest legacy code into semantic, line-aware chunks within a distributed Kubernetes-ready environment. (Mar 9)
