import os
from dotenv import load_dotenv

load_dotenv()

SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", 0.5))


def filter_and_rank(results: list[dict]) -> list[dict]:
    """
    Takes raw similarity search results and returns a cleaned,
    ranked list ready to send to the LLM as context.

    Steps:
    1. Filter out chunks below similarity threshold
    2. Deduplicate chunks from the same file + line range
    3. Boost chunks that have a function/class name (more semantic)
    4. Sort by final score descending
    """

    # Step 1 — Threshold filter
    filtered = [r for r in results if r["similarity_score"] >= SIMILARITY_THRESHOLD]

    if not filtered:
        return []

    # Step 2 — Deduplicate by (file_path, start_line, end_line)
    seen = set()
    deduplicated = []
    for chunk in filtered:
        key = (chunk.get("file_path"), chunk.get("start_line"), chunk.get("end_line"))
        if key not in seen:
            seen.add(key)
            deduplicated.append(chunk)

    # Step 3 — Boost named chunks (functions/classes are more semantically rich)
    def compute_score(chunk: dict) -> float:
        base_score = chunk["similarity_score"]
        boost = 0.0
        if chunk.get("function_name"):
            boost += 0.05
        return base_score + boost

    for chunk in deduplicated:
        chunk["final_score"] = compute_score(chunk)

    # Step 4 — Sort by final score descending
    ranked = sorted(deduplicated, key=lambda c: c["final_score"], reverse=True)

    return ranked


def format_sources(ranked: list[dict]) -> list[dict]:
    """
    Convert ranked chunks into the API contract source format.
    """
    return [
        {
            "file_path": r.get("file_path", ""),
            "line_range": f"{r.get('start_line', '?')}-{r.get('end_line', '?')}",
            "similarity_score": round(r["similarity_score"], 4),
        }
        for r in ranked
    ]
