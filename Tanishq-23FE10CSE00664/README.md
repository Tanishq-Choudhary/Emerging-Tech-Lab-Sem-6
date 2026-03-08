# CodeAtlas

CodeAtlas is a distributed semantic search engine designed to analyze and query legacy codebases using a Retrieval-Augmented Generation (RAG) architecture. This repository contains the core platform, container infrastructure, and semantic ingestion pipeline.

## 🚀 Overview

The system is built on a microservices-oriented architecture, engineered for high throughput and horizontal scalability. It orchestrates the lifecycle of source code analysis—from initial multipart upload to language-aware structural chunking—providing a robust foundation for AI-driven code comprehension.

- **Platform & Ingestion (Lead: Tanishq Choudhary)**: API Gateway, Worker Pipelines, PostgreSQL Persistence, and Kubernetes Orchestration.
- **RAG Engine (Collaborator: Divyanshu)**: Semantic Vectorization and Query Interface.

## 🛠 Tech Stack

- **Core Runtime**: Node.js 22 (LTS)
- **Data Layer**: PostgreSQL 16
- **Architecture**: Microservices (API Gateway + Background Ingestion Worker)
- **Containerization**: Docker & Kubernetes
- **Quality Assurance**: Native Node.js Test Runner
- **Observability**: JSON Structured Logging & Health Probes

## 📂 Project Structure

- `services/api-gateway`: Express-based entry point. Manages routing, security headers, and rate limiting.
- `services/ingestion-service`: Asynchronous worker that performs structural AST analysis and code chunking.
- `services/shared`: Centralized library for models, migrations, and shared utility modules.
- `infra/docker`: Configuration for local development (`docker-compose.dev.yml`) and production deployments.
- `infra/kubernetes`: Production-grade manifests for deployment (Namespaces, PVCs, ConfigMaps).
- `docs/`: Comprehensive technical documentation for architecture, deployment, and integration.

## 🚦 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 22 (for local development)

### Quick Start
1. Clone the repository.
2. Build and start the environment:
   ```bash
   cd infra/docker
   docker-compose -f docker-compose.dev.yml up --build
   ```
3. Access the **Control Center** by opening `test-ui.html` in your web browser.

## 📖 Documentation
- [Architecture Overview](./docs/architecture.md)
- [Deployment Guide](./docs/deployment.md)
- [RAG Integration Guide](./docs/rag-integration-guide.md)
- [Technical Presentation Guide](./docs/demo-guide.md)

---
Developed for Emerging Technologies Lab - 2026.
