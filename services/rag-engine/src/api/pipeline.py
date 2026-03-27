import os
from dotenv import load_dotenv
from ..embeddings.embedder import embed_query
from ..vector_store.chroma_store import similarity_search
from ..llm.generator import generate_answer

load_dotenv()

SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", 0.5))

def run_query_pipeline(question: str, top_k: int = 5) -> dict:
    """
    Full RAG pipeline:
    1. Embed the question
    2. Search ChromaDB for top_k similar chunks
    3. Filter by similarity threshold
    4. Generate answer via LLM
    5. Return answer + sources in API contract format
    """

    # Step 1 — Embed the query
    print(f"[pipeline] Embedding query: '{question}'")
    query_embedding = embed_query(question)

    # Step 2 — Vector search
    print(f"[pipeline] Searching vector store (top_k={top_k})...")
    results = similarity_search(query_embedding, top_k=top_k)

    if not results:
        print("[pipeline] No results from vector store.")
        return {
            "answer": "No relevant code found in the codebase for your query.",
            "sources": []
        }

    # Step 3 — Filter by similarity threshold
    filtered = [r for r in results if r["similarity_score"] >= SIMILARITY_THRESHOLD]
    print(f"[pipeline] {len(filtered)}/{len(results)} chunks passed threshold ({SIMILARITY_THRESHOLD}).")

    if not filtered:
        print("[pipeline] All results below threshold.")
        return {
            "answer": "No sufficiently relevant code was found for your query. Try rephrasing.",
            "sources": []
        }

    # Step 4 — Generate answer via LLM
    print(f"[pipeline] Sending {len(filtered)} chunks to LLM for answer generation...")
    answer = generate_answer(question, filtered)

    # Step 5 — Format sources to match API contract
    sources = [
        {
            "file_path": r["file_path"],
            "line_range": f"{r['start_line']}-{r['end_line']}",
            "similarity_score": r["similarity_score"],
        }
        for r in filtered
    ]

    print(f"[pipeline] Pipeline complete. Returning answer with {len(sources)} sources.")
    return {
        "answer": answer,
        "sources": sources
    }
