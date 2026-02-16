# Distributed Semantic Search Engine
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
## Current Status (First Commit)

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



## Current Status (Second Commit)

- Completed the planned Week‑1 setup from the first commit
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
