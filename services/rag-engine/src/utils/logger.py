import json
import logging
import sys
from datetime import datetime, timezone

SERVICE_NAME = "rag-engine"

class JSONFormatter(logging.Formatter):
    """
    Formats every log record as a single-line JSON object.
    Matches the structured logging format used by Tanishq's
    Node.js services for consistent log aggregation in Kubernetes.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "service": SERVICE_NAME,
            "level": record.levelname,
            "module": record.module,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


def get_logger(module_name: str) -> logging.Logger:
    """
    Returns a named logger with JSON formatting attached.
    Usage: logger = get_logger(__name__)
    """
    logger = logging.getLogger(module_name)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False

    return logger


# Request logger — logs every incoming HTTP request
def request_logger(method: str, path: str, status_code: int, duration_ms: float):
    logger = get_logger("request")
    logger.info(
        json.dumps({
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "service": SERVICE_NAME,
            "level": "INFO",
            "type": "request",
            "method": method,
            "path": path,
            "status_code": status_code,
            "duration_ms": round(duration_ms, 2),
        })
    )
