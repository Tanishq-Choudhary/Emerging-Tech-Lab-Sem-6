import threading
from fastapi import APIRouter, HTTPException
from .schemas import QueryRequest, QueryResponse, SourceResult, HealthResponse, IndexResponse
from .pipeline import run_query_pipeline
from ..vector_store.chroma_store import get_collection_count
from ..indexing.state import indexer_state
from ..indexing.indexer import run_indexing_cycle
from ..db.connection import get_connection, release_connection
from ..utils.sanitizer import sanitize_question
from ..utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check():
    postgres_status = "unreachable"
    try:
        conn = get_connection()
        release_connection(conn)
        postgres_status = "connected"
    except Exception:
        pass

    try:
        count = get_collection_count()
        vector_status = "ready" if count > 0 else "empty"
    except Exception:
        count = 0
        vector_status = "unavailable"

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
    clean_question = sanitize_question(request.question)

    if not clean_question:
        raise HTTPException(
            status_code=400,
            detail="Question is empty after sanitization. Please rephrase."
        )

    try:
        result = run_query_pipeline(
            question=clean_question,
            top_k=request.top_k
        )
        return QueryResponse(
            answer=result["answer"],
            sources=[SourceResult(**s) for s in result["sources"]]
        )
    except Exception as e:
        logger.error(f"/query error: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your query."
        )


@router.post("/index", response_model=IndexResponse)
def trigger_index(full: bool = False):
    """
    Manually trigger a re-indexing cycle.
    - full=false (default): incremental sync, only new chunks since last run
    - full=true: wipe and re-index everything from scratch

    Essential for demo flow:
    1. Upload code via Tanishq's Control Center
    2. Hit POST /index to sync new chunks into ChromaDB
    3. Query immediately
    """
    if indexer_state["status"] == "running":
        raise HTTPException(
            status_code=409,
            detail="Indexing already in progress. Please wait and try again."
        )

    logger.info(f"Manual index triggered. full={full}")

    # Run in background thread so the HTTP response returns immediately
    def run():
        try:
            run_indexing_cycle(full_reindex=full)
        except Exception as e:
            logger.error(f"Manual index cycle failed: {e}")

    thread = threading.Thread(target=run, daemon=True, name="manual-index-thread")
    thread.start()

    return IndexResponse(
        success=True,
        chunks_indexed=indexer_state.get("last_cycle_count", 0),
        message=f"{'Full' if full else 'Incremental'} indexing started in background."
    )
