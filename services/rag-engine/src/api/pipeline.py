import os
from dotenv import load_dotenv
from ..embeddings.embedder import embed_query
from ..vector_store.chroma_store import similarity_search
from ..llm.generator import generate_answer
from .reranker import filter_and_rank, format_sources

load_dotenv()

def run_query_pipeline(question: str, top_k: int = 5) -> dict:
    """
    Full RAG pipeline:
    1. Embed the question using BGE model
    2. Search ChromaDB for top_k similar chunks
    3. Filter by similarity threshold + deduplicate + re-rank
    4. Generate answer via LLM using ranked context
    5. Return answer + formatted sources
    """

    # Step 1 — Embed the query
    print(f"[pipeline] Embedding query: '{question}'")
    query_embedding = embed_query(question)

    # Step 2 — Vector search
    # Fetch more than top_k so reranker has room to filter and still return top_k
    fetch_k = min(top_k * 2, 20)
    print(f"[pipeline] Searching vector store (fetch_k={fetch_k}, top_k={top_k})...")
    raw_results = similarity_search(query_embedding, top_k=fetch_k)

    if not raw_results:
        print("[pipeline] No results from vector store.")
        return {
            "answer": "No relevant code found in the codebase for your query.",
            "sources": []
        }

    # Step 3 — Filter, deduplicate, re-rank
    ranked = filter_and_rank(raw_results)
    print(f"[pipeline] {len(ranked)}/{len(raw_results)} chunks passed filtering and ranking.")

    if not ranked:
        print("[pipeline] All results below threshold after filtering.")
        return {
            "answer": "No sufficiently relevant code was found. Try rephrasing your question.",
            "sources": []
        }

    # Trim to top_k after ranking
    top_chunks = ranked[:top_k]

    # Step 4 — Generate answer via LLM
    print(f"[pipeline] Sending {len(top_chunks)} ranked chunks to LLM...")
    answer = generate_answer(question, top_chunks)

    # Step 5 — Format sources for API response
    sources = format_sources(top_chunks)

    print(f"[pipeline] Pipeline complete. Returning answer with {len(sources)} sources.")
    return {
        "answer": answer,
        "sources": sources
    }