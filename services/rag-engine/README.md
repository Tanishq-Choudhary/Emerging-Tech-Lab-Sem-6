# RAG Engine — CodeAtlas

## Ownership
**Divyanshu** — Semantic Vectorization & Query Interface

This service is responsible for:
- Reading pre-processed code chunks from the shared PostgreSQL database
- Generating vector embeddings using `BAAI/bge-base-en-v1.5`
- Storing and querying embeddings via ChromaDB
- Generating natural language answers using an LLM
- Exposing a `POST /query` HTTP endpoint consumed by the API Gateway

---

## API Contract

### POST /query
**Request (sent by API Gateway):**
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

---

## Architecture Position
The RAG Engine runs as a separate microservice at `http://rag-engine:8001` within
the Docker/Kubernetes network. It does NOT parse code — it reads semantic chunks
already processed by the Ingestion Service from the `chunk_metadata` table.

---

## Responsibilities Split
| Area | Owner |
|---|---|
| API Gateway, Ingestion, PostgreSQL, Kubernetes | Tanishq Choudhary |
| Embeddings, Vector DB, LLM Generation | Divyanshu |

---
*Architecture locked: January 26, 2026*
```