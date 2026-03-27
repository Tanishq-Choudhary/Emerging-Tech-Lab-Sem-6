import os
import threading
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router
from .indexing.indexer import start_polling_loop
from .db.connection import close_pool

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ---- Startup ----
    print("[main] CodeAtlas RAG Engine starting up...")

    # Start the background indexing loop in a daemon thread
    # Daemon = thread dies automatically when the main process exits
    indexer_thread = threading.Thread(
        target=start_polling_loop,
        daemon=True,
        name="indexer-polling-thread"
    )
    indexer_thread.start()
    print("[main] Background indexer thread started.")

    yield  # App is now running and serving requests

    # ---- Shutdown ----
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

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("src.main:app", host="0.0.0.0", port=port, reload=False)
