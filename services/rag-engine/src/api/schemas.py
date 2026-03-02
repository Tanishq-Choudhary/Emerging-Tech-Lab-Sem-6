from pydantic import BaseModel, Field, field_validator
from typing import Optional

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=20)

    @field_validator("question")
    @classmethod
    def question_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Question must not be blank or whitespace only.")
        return v.strip()

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

class IndexResponse(BaseModel):
    success: bool
    chunks_indexed: int
    message: str
