from dataclasses import dataclass
from typing import Optional
from datetime import datetime, timezone
from .connection import get_connection, release_connection

@dataclass
class ChunkRecord:
    chunk_id: int
    original_path: str
    repository_name: str
    language: str
    chunk_text: str
    start_line: int
    end_line: int
    chunk_type: str
    function_name: Optional[str]
    class_name: Optional[str]

def fetch_chunks_since(last_sync_time: Optional[datetime] = None) -> list[ChunkRecord]:
    if last_sync_time is None:
        last_sync_time = datetime.fromtimestamp(0, tz=timezone.utc)

    query = """
        SELECT
            c.id AS chunk_id,
            d.original_path,
            d.repository_name,
            d.language,
            c.content AS chunk_text,
            c.start_line,
            c.end_line,
            c.chunk_type,
            c.function_name,
            c.class_name
        FROM chunk_metadata c
        JOIN documents d ON c.document_id = d.id
        WHERE c.created_at > %s;
    """

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, (last_sync_time,))
            rows = cur.fetchall()
            return [ChunkRecord(*row) for row in rows]
    finally:
        release_connection(conn)

def fetch_all_chunks() -> list[ChunkRecord]:
    return fetch_chunks_since(None)
