from fastapi import APIRouter, HTTPException
from .schemas import QueryRequest, QueryResponse, SourceResult, HealthResponse
from ..vector_store.chroma_store import get_collection_count
from ..indexing.state import indexer_state
from ..db.connection import get_connection, release_connection

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    # Check Postgres connectivity
    postgres_status = "unreachable"
    try:
        conn = get_connection()
        release_connection(conn)
        postgres_status = "connected"
    except Exception as e:
        print(f"[health] Postgres check failed: {e}")

    # Check vector store
    try:
        count = get_collection_count()
        vector_status = "ready" if count > 0 else "empty"
    except Exception as e:
        print(f"[health] Chroma check failed: {e}")
        count = 0
        vector_status = "unavailable"

    # Overall health
    if postgres_status == "connected" and vector_status == "ready":
        overall = "healthy"
    elif postgres_status == "unreachable":
        overall = "unhealthy"
    else:
        overall = "degraded"

    last_sync = indexer_state["last_sync_time"]
    last_sync_str = last_sync.isoformat() if last_sync else None

    return HealthResponse(
        status=overall,
        postgres=postgres_status,
        vector_store=vector_status,
        chunks_indexed=count,
        indexer_status=indexer_state["status"],
        last_sync_time=last_sync_str,
    )


@router.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    # Stub — full pipeline wired in Commit 9
    raise HTTPException(
        status_code=501,
        detail="Query pipeline not yet implemented. Coming in next commit."
    )