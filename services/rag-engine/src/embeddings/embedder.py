from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv

load_dotenv()

# BGE models require specific prefixes for queries vs documents
# This significantly improves retrieval accuracy
QUERY_PREFIX = "Represent this sentence for searching relevant passages: "
DOCUMENT_PREFIX = "Represent this code snippet: "

_model = None

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        model_name = os.getenv("EMBEDDING_MODEL", "BAAI/bge-base-en-v1.5")
        print(f"[embedder] Loading model: {model_name}")
        _model = SentenceTransformer(model_name)
        print(f"[embedder] Model loaded successfully.")
    return _model

def embed_query(question: str) -> list[float]:
    model = get_model()
    prefixed = QUERY_PREFIX + question
    embedding = model.encode(prefixed, normalize_embeddings=True)
    return embedding.tolist()

def embed_documents(chunks: list[dict]) -> list[dict]:
    """
    Accepts a list of dicts with keys:
      - chunk_id, chunk_text, original_path, function_name, repository_name
    Returns the same list with an added 'embedding' key on each item.
    """
    model = get_model()
    texts = []

    for chunk in chunks:
        # Build rich context string before embedding
        context_parts = [f"File: {chunk.get('original_path', '')}"]
        if chunk.get("function_name"):
            context_parts.append(f"Function: {chunk['function_name']}")
        elif chunk.get("class_name"):
            context_parts.append(f"Class: {chunk['class_name']}")
        context_header = ", ".join(context_parts)
        full_text = DOCUMENT_PREFIX + f"{context_header}\n\n{chunk['chunk_text']}"
        texts.append(full_text)

    embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=True)

    for i, chunk in enumerate(chunks):
        chunk["embedding"] = embeddings[i].tolist()

    return chunks