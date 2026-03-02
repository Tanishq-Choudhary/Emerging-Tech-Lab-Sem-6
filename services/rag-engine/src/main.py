import os
import threading
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from .api.routes import router
from .indexing.indexer import start_polling_loop
from .db.connection import close_pool
from .utils.errors import (
    http_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler,
)

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[main] CodeAtlas RAG Engine starting up...")
    indexer_thread = threading.Thread(
        target=start_polling_loop,
        daemon=True,
        name="indexer-polling-thread"
    )
    indexer_thread.start()
    print("[main] Background indexer thread started.")

    yield

    print("[main] Shutting down RAG Engine...")
    close_pool()
    print("[main] Postgres connection pool closed. Goodbye.")


app = FastAPI(
    title="CodeAtlas RAG Engine",
    description="Semantic search and answer generation for legacy codebases.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("src.main:app", host="0.0.0.0", port=port, reload=False)
