from datetime import datetime, timezone

# Shared indexer state accessible across the app
indexer_state = {
    "last_sync_time": datetime.fromtimestamp(0, tz=timezone.utc),
    "total_indexed": 0,
    "last_cycle_count": 0,
    "status": "idle",  # idle | running | error
}