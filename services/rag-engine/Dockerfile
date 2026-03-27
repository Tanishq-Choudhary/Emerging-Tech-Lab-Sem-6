# Stage 1 — Builder: install dependencies
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies into a separate location
COPY requirements.txt .
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt

# Stage 2 — Final image: lean runtime
FROM python:3.11-slim

WORKDIR /app

# Install only runtime system dependency (libpq for psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY src/ ./src/
COPY run.py .

# ChromaDB persistence directory
RUN mkdir -p /app/chroma_data

# Pre-download the embedding model at build time so
# container startup is instant (no runtime download)
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-base-en-v1.5')"

EXPOSE 8001

CMD ["python", "run.py"]
