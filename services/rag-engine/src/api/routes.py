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


@router.get("/graph")
def get_code_graph(repository: str = None):
    """
    Returns a graph of documents, classes, and functions for the code visualizer.
    Query param: ?repository=<name> to filter by repo (optional).
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        sql = """
            SELECT
                d.id          AS doc_id,
                d.original_path,
                d.repository_name,
                d.language,
                c.id          AS chunk_id,
                c.chunk_type,
                c.function_name,
                c.class_name,
                c.start_line,
                c.end_line
            FROM documents d
            LEFT JOIN chunk_metadata c ON c.document_id = d.id
        """
        if repository:
            sql += " WHERE d.repository_name = %s"
            cursor.execute(sql + " ORDER BY d.id, c.start_line", (repository,))
        else:
            cursor.execute(sql + " ORDER BY d.id, c.start_line")

        rows = cursor.fetchall()
        cursor.close()

        nodes = {}       # node_id -> node dict
        edges_seen = set()
        edges = []

        def add_edge(from_id, to_id):
            key = (from_id, to_id)
            if key not in edges_seen:
                edges_seen.add(key)
                edges.append({"from": from_id, "to": to_id})

        for row in rows:
            (doc_id, orig_path, repo_name, language,
             chunk_id, chunk_type, function_name, class_name,
             start_line, end_line) = row

            # --- document node ---
            doc_node_id = f"doc_{doc_id}"
            if doc_node_id not in nodes:
                filename = orig_path.split("/")[-1] if orig_path else f"doc_{doc_id}"
                nodes[doc_node_id] = {
                    "id":    doc_node_id,
                    "label": filename,
                    "title": f"{orig_path or 'unknown'}\n{repo_name} · {language or 'unknown'}",
                    "type":  "file",
                    "group": "file",
                }

            if chunk_id is None:
                continue

            # --- class node ---
            if class_name:
                cls_node_id = f"cls_{doc_id}_{class_name}"
                if cls_node_id not in nodes:
                    nodes[cls_node_id] = {
                        "id":    cls_node_id,
                        "label": class_name,
                        "title": f"class {class_name}\n{orig_path}",
                        "type":  "class",
                        "group": "class",
                    }
                    add_edge(doc_node_id, cls_node_id)

            # --- function / method node ---
            if function_name:
                fn_node_id = f"fn_{doc_id}_{function_name}"
                if fn_node_id not in nodes:
                    kind = "method" if class_name else "function"
                    nodes[fn_node_id] = {
                        "id":    fn_node_id,
                        "label": function_name,
                        "title": f"{kind}: {function_name}()\nlines {start_line}–{end_line}\n{orig_path}",
                        "type":  "function",
                        "group": "function",
                    }
                    # attach to class if available, else to document
                    cls_node_id = f"cls_{doc_id}_{class_name}"
                    parent = cls_node_id if class_name and cls_node_id in nodes else doc_node_id
                    add_edge(parent, fn_node_id)

        stats = {
            "files":     sum(1 for n in nodes.values() if n["type"] == "file"),
            "classes":   sum(1 for n in nodes.values() if n["type"] == "class"),
            "functions": sum(1 for n in nodes.values() if n["type"] == "function"),
        }

        return {"nodes": list(nodes.values()), "edges": edges, "stats": stats}

    except Exception as e:
        logger.error(f"/graph error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            release_connection(conn)