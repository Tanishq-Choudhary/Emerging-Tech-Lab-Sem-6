import re

# Characters that have no place in a natural language code query
_DANGEROUS_PATTERNS = re.compile(r"[<>{};`\\]")

def sanitize_question(text: str) -> str:
    """
    Strip potentially dangerous characters from the question
    before it touches the embedding model or LLM prompt.
    """
    sanitized = _DANGEROUS_PATTERNS.sub("", text)
    # Collapse multiple spaces/newlines into single space
    sanitized = re.sub(r"\s+", " ", sanitized).strip()
    return sanitized
