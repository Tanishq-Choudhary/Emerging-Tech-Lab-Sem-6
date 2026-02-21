import os
import time
from datetime import datetime, timezone
from dotenv import load_dotenv

from ..db.chunk_reader import fetch_chunks_since, fetch_all_chunks
from ..embeddings.embedder import embed_documents
from ..embeddings.utils import chunk_record_to_dict
from ..vector_store.chroma_store import upsert_chunks, get_collection_count
from .state import indexer_state

load_dotenv()

def run_indexing_cycle(full_reindex: bool = False) -> int:
    global indexer_state

    indexer_state["status"] = "running"
    print(f"[indexer] Starting {'full' if full_reindex else 'incremental'} indexing cycle...")

    try:
        if full_reindex:
            records = fetch_all_chunks()
        else:
            records = fetch_chunks_since(indexer_state["last_sync_time"])

        if not records:
            print(f"[indexer] No new chunks found. Skipping.")
            indexer_state["status"] = "idle"
            return 0

        print(f"[indexer] Fetched {len(records)} new chunks from Postgres.")

        chunks = [chunk_record_to_dict(record) for record in records]
        chunks_with_embeddings = embed_documents(chunks)
        count = upsert_chunks(chunks_with_embeddings)

        indexer_state["last_sync_time"] = datetime.now(tz=timezone.utc)
        indexer_state["total_indexed"] += count
        indexer_state["last_cycle_count"] = count
        indexer_state["status"] = "idle"

        print(f"[indexer] Cycle complete. {count} chunks indexed. Total in store: {get_collection_count()}")
        return count

    except Exception as e:
        indexer_state["status"] = "error"
        print(f"[indexer] Indexing cycle failed: {e}")
        raise

def start_polling_loop():
    interval = int(os.getenv("SYNC_INTERVAL_SECONDS", 60))
    print(f"[indexer] Polling loop started. Interval: {interval}s")

    run_indexing_cycle(full_reindex=True)

    while True:
        time.sleep(interval)
        try:
            run_indexing_cycle(full_reindex=False)
        except Exception as e:
            print(f"[indexer] Error during polling loop: {e}")
