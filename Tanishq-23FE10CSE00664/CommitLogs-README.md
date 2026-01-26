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

- Repository initialized
- Architecture agreed with teammate
- Responsibilities clearly split
- No production code yet

This commit intentionally contains **only documentation** to lock scope and ownership before implementation begins.

---

## Immediate Next Steps

- Define API contracts for upload and ingestion
- Design PostgreSQL schema for documents and jobs
- Create base service skeletons
- Set up local Kubernetes cluster (minikube or kind)
