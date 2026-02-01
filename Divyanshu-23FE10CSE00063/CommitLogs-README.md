# Distributed Semantic Search Engine
## Retrieval, Embeddings & RAG (Person B)

This repository implements a distributed semantic search and question answering system using vector embeddings and Retrieval-Augmented Generation (RAG). The system retrieves relevant document chunks and generates grounded answers using an LLM.

This README reflects the responsibilities and current focus of **Person B**, who owns retrieval quality, embedding pipelines, and RAG logic.

---

## What I’m Building

I am responsible for the **intelligence layer** of the system. This includes how documents are chunked, embedded, indexed, retrieved, and finally used to generate grounded answers.

The focus is on:
- Retrieval accuracy
- Low query latency
- Strict grounding to avoid hallucinations
- Clean RAG orchestration

---

## My Ownership Areas

- Text chunking and overlap strategy
- Embedding generation pipeline
- Vector database setup (FAISS / Qdrant)
- Similarity search and Top-K retrieval
- RAG pipeline orchestration
- Prompt design and grounding
- Query latency optimization

---

## Current Status (First Commit)

- Repository initialized
- Architecture and service boundaries agreed
- Clear ownership split with platform side
- No implementation yet

This commit establishes intent and responsibility before development starts.

---

## Immediate Next Steps

- Finalize chunking strategy
- Choose embedding model
- Set up vector database locally
- Define retrieval APIs with query orchestrator
