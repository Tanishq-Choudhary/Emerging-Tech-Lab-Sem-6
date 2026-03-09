
# RAG Engine — CodeAtlas

## Ownership
**Divyanshu** — Semantic Vectorization & Query Interface

This service is the AI backbone of CodeAtlas. It reads pre-processed code chunks
from the shared PostgreSQL database, generates vector embeddings, stores them in
ChromaDB, and answers natural language questions about the codebase using an LLM.

---

## Architecture Position

```
Client → API Gateway (port 3000) → RAG Engine (port 8001)
                                        ↓
                                   ChromaDB (local)
                                        ↑
                                   PostgreSQL ← Ingestion Service
```

The RAG Engine runs as a separate microservice at `http://rag-engine:8001`
within the Docker/Kubernetes network. It does NOT parse code — it reads
semantic chunks already processed by the Ingestion Service.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Python 3.11 |
| API Framework | FastAPI + Uvicorn |
| Embedding Model | BAAI/bge-base-en-v1.5 (HuggingFace) |
| Vector Store | ChromaDB (persistent, cosine similarity) |
| LLM | Mistral-7B-Instruct-v0.2 (HuggingFace Inference API) |
| Database Client | psycopg2 (reads from shared PostgreSQL) |
| Containerization | Docker |
| Orchestration | Kubernetes |

---

## API Endpoints

### `POST /query`
Accepts a natural language question and returns a grounded answer with sources.

**Request:**
```json
{
  "question": "Where is the authentication logic handled?",
  "top_k": 5
}
```

**Response:**
```json
{
  "answer": "The authentication logic is handled in `src/auth.js`...",
  "sources": [
    {
      "file_path": "/app/uploads/auth.js",
      "line_range": "10-25",
      "similarity_score": 0.89
    }
  ]
}
```

### `GET /health`
Returns service health including Postgres connectivity, ChromaDB status,
chunks indexed, and indexer state.

### `POST /index?full=false`
Manually triggers a re-indexing cycle.
- `full=false` — incremental sync (new chunks only)
- `full=true` — full wipe and re-index

---

## Local Development Setup

### Prerequisites
- Python 3.11
- Docker & Docker Compose (for full stack)

### Run Standalone
```bash
cd services/rag-engine
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
python -m uvicorn src.main:app --host 0.0.0.0 --port 8001
```

### Run Full Stack (with Tanishq's services)
```bash
cd infra/docker
docker-compose -f docker-compose.dev.yml up --build
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_HOST` | `postgres` | PostgreSQL hostname |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_DB` | `codeatlas` | Database name |
| `POSTGRES_USER` | `codeatlas` | Database user |
| `POSTGRES_PASSWORD` | — | Database password |
| `CHROMA_PERSIST_PATH` | `./chroma_data` | ChromaDB storage path |
| `EMBEDDING_MODEL` | `BAAI/bge-base-en-v1.5` | HuggingFace embedding model |
| `HF_API_TOKEN` | — | HuggingFace API token (free) |
| `LLM_MODEL` | `mistralai/Mistral-7B-Instruct-v0.2` | HuggingFace LLM model |
| `SIMILARITY_THRESHOLD` | `0.5` | Minimum similarity score cutoff |
| `TOP_K_DEFAULT` | `5` | Default number of chunks to retrieve |
| `SYNC_INTERVAL_SECONDS` | `60` | Background indexer poll interval |
| `PORT` | `8001` | Service port |

---

## Demo Flow

1. Start full stack via Docker Compose
2. Upload legacy code via Tanishq's Control Center (`test-ui.html`)
3. Hit `POST /index?full=true` to sync new chunks into ChromaDB
4. Hit `POST /query` with a natural language question
5. Receive answer with exact file paths and line numbers

---

## Running Tests
```bash
cd services/rag-engine
python -m pytest tests/ -v
```

24 tests across embedding pipeline, chunk reader, and query endpoint.

---
*Developed for Emerging Tools & Technologies Lab — 2026*