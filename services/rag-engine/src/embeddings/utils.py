from ..db.chunk_reader import ChunkRecord

def chunk_record_to_dict(record: ChunkRecord) -> dict:
    """Convert a ChunkRecord dataclass into a plain dict for embedding."""
    return {
        "chunk_id": str(record.chunk_id),
        "chunk_text": record.chunk_text,
        "original_path": record.original_path,
        "repository_name": record.repository_name,
        "language": record.language,
        "function_name": record.function_name,
        "class_name": record.class_name,
        "start_line": record.start_line,
        "end_line": record.end_line,
        "chunk_type": record.chunk_type,
    }