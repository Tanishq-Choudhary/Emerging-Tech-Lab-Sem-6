# Technical Presentation: CodeAtlas Platform

This guide provides a technical overview of the CodeAtlas platform architecture and ingestion pipeline for evaluation purposes.

## 1. System Architecture & Containerization
The platform is implemented as a distributed microservices architecture using Node.js 22 (LTS) and PostgreSQL 16. Local orchestration is managed via Docker Compose, reflecting the production-grade Kubernetes deployment strategy.

- **Component Check**: Verify the three core service containers are operational: `api-gateway`, `ingestion-service`, and `postgres`.
- **Infrastructure Path**: `infra/docker/docker-compose.dev.yml`

## 2. Health Monitoring & Service Readiness
The API Gateway implements active health-probe endpoints. These probes perform shallow liveness checks and deep readiness checks by validating downstream connectivity to the PostgreSQL cluster and ingestion workers.

- **Verification**: The **Control Center** (`test-ui.html`) provides real-time visibility into these health states.

## 3. Asynchronous Ingestion & Job Orchestration
To ensure high availability, the platform uses an asynchronous non-blocking ingestion pattern. Uploaded documents are persisted and registered as tasks in the `ingestion_jobs` repository, allowing the gateway to remain responsive regardless of job complexity.

- **Demonstration**: Uploading a source file (e.g., `.js`, `.py`, `.java`) via the Control Center and observing the background job registration in the diagnostic trace.

## 4. Semantic Parsing & AST Analysis
The ingestion service executes language-aware structural analysis. Rather than basic text splitting, it utilizes a specialized parser to identify logical code blocks, including functional definitions and class structures.

- **Outcome**: Each document is transformed into semantic chunks with associated line-range metadata. This structure is accessible via the `/api/documents/:id/chunks` endpoint and visible in the Control Center.

## 5. Scalable Persistence Strategy
The data layer utilizes PostgreSQL with a concurrency-safe job management strategy. Workers leverage a `FOR UPDATE SKIP LOCKED` mechanism, enabling multiple parallel ingestion instances to process the shared queue without synchronization overhead or race conditions.

## 6. API Interface for RAG Integration
The platform exposes a clean REST boundary for third-party consumption. Any downstream retrieval engine (RAG) can consume processed semantic units through the standardized document and chunking endpoints, enabling seamless AI-driven code comprehension.

---
*Reference: [Architecture Overview](../docs/architecture.md) | [Deployment Guide](../docs/deployment.md)*
