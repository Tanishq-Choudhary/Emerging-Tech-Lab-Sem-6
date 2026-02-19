import chromadb
import os
from dotenv import load_dotenv

load_dotenv()

COLLECTION_NAME = "codeatlas_chunks"

_client = None
_collection = None

def get_client() -> chromadb.Client:
    global _client
    if _client is None:
        persist_path = os.getenv("CHROMA_PERSIST_PATH", "./chroma_data")
        print(f"[chroma] Initializing persistent client at: {persist_path}")
        _client = chromadb.PersistentClient(path=persist_path)
    return _client

def get_collection():
    global _collection
    if _collection is None:
        client = get_client()
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}  # cosine similarity for BGE embeddings
        )
        print(f"[chroma] Collection '{COLLECTION_NAME}' ready. Count: {_collection.count()}")
    return _collection

def upsert_chunks(chunks: list[dict]) -> int:
    """
    Upsert a list of embedded chunks into ChromaDB.
    Each chunk dict must have: chunk_id, embedding, chunk_text,
    original_path, repository_name, language, start_line, end_line,
    function_name, class_name, chunk_type
    """
    if not chunks:
        return 0

    collection = get_collection()

    ids = [str(chunk["chunk_id"]) for chunk in chunks]
    embeddings = [chunk["embedding"] for chunk in chunks]
    documents = [chunk["chunk_text"] for chunk in chunks]
    metadatas = [
        {
            "original_path": chunk.get("original_path", ""),
            "repository_name": chunk.get("repository_name", ""),
            "language": chunk.get("language", ""),
            "start_line": int(chunk.get("start_line", 0)),
            "end_line": int(chunk.get("end_line", 0)),
            "function_name": chunk.get("function_name") or "",
            "class_name": chunk.get("class_name") or "",
            "chunk_type": chunk.get("chunk_type", ""),
        }
        for chunk in chunks
    ]

    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas
    )

    print(f"[chroma] Upserted {len(chunks)} chunks. Total count: {collection.count()}")
    return len(chunks)

def similarity_search(query_embedding: list[float], top_k: int = 5) -> list[dict]:
    """
    Search ChromaDB for the top_k most similar chunks to the query embedding.
    Returns a list of result dicts with text, metadata, and similarity score.
    """
    collection = get_collection()

    if collection.count() == 0:
        print("[chroma] Collection is empty — no results.")
        return []

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas", "distances"]
    )

    output = []
    documents = results["documents"][0]
    metadatas = results["metadatas"][0]
    distances = results["distances"][0]

    for doc, meta, distance in zip(documents, metadatas, distances):
        # ChromaDB cosine distance: 0 = identical, 2 = opposite
        # Convert to similarity score between 0 and 1
        similarity_score = round(1 - (distance / 2), 4)
        output.append({
            "chunk_text": doc,
            "file_path": meta.get("original_path", ""),
            "start_line": meta.get("start_line", 0),
            "end_line": meta.get("end_line", 0),
            "function_name": meta.get("function_name", ""),
            "repository_name": meta.get("repository_name", ""),
            "similarity_score": similarity_score,
        })

    return output

def get_collection_count() -> int:
    return get_collection().count()

def reset_collection():
    """Wipe and recreate the collection. Use with caution."""
    client = get_client()
    client.delete_collection(COLLECTION_NAME)
    global _collection
    _collection = None
    get_collection()
    print("[chroma] Collection reset complete.")