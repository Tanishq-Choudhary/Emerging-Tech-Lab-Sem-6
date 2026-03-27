from pydantic import BaseModel, Field
from typing import Optional

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=20)

class SourceResult(BaseModel):
    file_path: str
    line_range: str
    similarity_score: float

class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceResult]

class HealthResponse(BaseModel):
    status: str
    postgres: str
    vector_store: str
    chunks_indexed: int
    indexer_status: str
    last_sync_time: Optional[str]
