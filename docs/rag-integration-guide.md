# Integration Guide for RAG Engine

This guide provides the necessary information for integrating the RAG engine (owned by Divyanshu) with the core CodeAtlas platform.

## Communication Pattern
The API Gateway acts as a reverse proxy for user queries, forwarding them directly to the RAG engine. The RAG engine should run as a separate service within the same Docker/Kubernetes network.

### Service Discovery
In Docker Compose and Kubernetes environments, the RAG engine should be accessible at:
```
http://rag-engine:8001
```

## Endpoints

### 1. The Query Endpoint (API Gateway -> RAG Engine)
When a user submits a question, the API Gateway sends a `POST` request to the RAG engine.

**Expected Route on RAG Engine:**
`POST /query`

**Request Body Sent by Gateway:**
```json
{
  "question": "Where is the authentication logic handled?",
  "top_k": 5
}
```

**Expected Response from RAG Engine:**
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

### 2. Reading Processed Chunks
The RAG engine needs to build its vector database from the chunked legacy code. Rather than parsing the code itself, the RAG engine should read the pre-processed chunks from the PostgreSQL database managed by the ingestion service.

**Database Connection Options:**
Host: `postgres`
Port: `5432`
Database/User: `codeatlas` (see environment config)

**Reading Chunks Query:**
The RAG engine can run this query periodically or on startup to get the latest chunks to embed:
```sql
SELECT
  c.id as chunk_id,
  d.original_path,
  d.repository_name,
  d.language,
  c.content as chunk_text,
  c.start_line,
  c.end_line,
  c.chunk_type,
  c.function_name,
  c.class_name
FROM chunk_metadata c
JOIN documents d ON c.document_id = d.id
WHERE c.created_at > $LAST_SYNC_TIME;
```

## Embedding Best Practices
- The text content is located in the `chunk_text` field.
- When generating the embedding, you may want to prepend the `repository_name` and `original_path` or `function_name` to the chunk text to give the embedding model better context.
- E.g. `File: src/auth.js, Function: login\n\nfunction login(req, res) { ... }`
