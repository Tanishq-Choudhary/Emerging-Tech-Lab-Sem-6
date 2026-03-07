import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


# ── Patch heavy dependencies before the app is imported ──────────────────────
# This prevents the BGE model from loading and Postgres from connecting
# during test collection

@pytest.fixture(scope="module")
def client():
    with patch("src.indexing.indexer.start_polling_loop"), \
         patch("src.db.connection.get_pool"):
        from src.main import app
        with TestClient(app) as c:
            yield c


# ── /query tests ─────────────────────────────────────────────────────────────

class TestQueryEndpoint:

    def test_valid_request_returns_200(self, client):
        with patch("src.api.routes.run_query_pipeline") as mock_pipeline:
            mock_pipeline.return_value = {
                "answer": "The auth logic is in src/auth.js",
                "sources": [
                    {
                        "file_path": "/app/uploads/auth.js",
                        "line_range": "10-25",
                        "similarity_score": 0.89,
                    }
                ]
            }
            response = client.post("/query", json={
                "question": "Where is the authentication logic?",
                "top_k": 5
            })

        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert "sources" in data
        assert data["answer"] == "The auth logic is in src/auth.js"
        assert len(data["sources"]) == 1

    def test_response_matches_api_contract(self, client):
        with patch("src.api.routes.run_query_pipeline") as mock_pipeline:
            mock_pipeline.return_value = {
                "answer": "Found in db.js",
                "sources": [
                    {
                        "file_path": "/app/uploads/db.js",
                        "line_range": "5-20",
                        "similarity_score": 0.91,
                    }
                ]
            }
            response = client.post("/query", json={
                "question": "How is the database connection managed?",
                "top_k": 3
            })

        assert response.status_code == 200
        source = response.json()["sources"][0]
        # Verify exact contract fields from rag-integration-guide
        assert "file_path" in source
        assert "line_range" in source
        assert "similarity_score" in source

    def test_empty_results_returns_200_with_empty_sources(self, client):
        with patch("src.api.routes.run_query_pipeline") as mock_pipeline:
            mock_pipeline.return_value = {
                "answer": "No relevant code found in the codebase for your query.",
                "sources": []
            }
            response = client.post("/query", json={
                "question": "What is the meaning of life?",
                "top_k": 5
            })

        assert response.status_code == 200
        assert response.json()["sources"] == []

    def test_top_k_is_passed_to_pipeline(self, client):
        with patch("src.api.routes.run_query_pipeline") as mock_pipeline:
            mock_pipeline.return_value = {"answer": "test", "sources": []}
            client.post("/query", json={
                "question": "Where is the login function?",
                "top_k": 7
            })
            _, kwargs = mock_pipeline.call_args
            assert mock_pipeline.call_args[1]["top_k"] == 7 or \
                   mock_pipeline.call_args[0][1] == 7

    def test_question_too_short_returns_422(self, client):
        response = client.post("/query", json={
            "question": "hi",
            "top_k": 5
        })
        assert response.status_code == 422

    def test_question_missing_returns_422(self, client):
        response = client.post("/query", json={"top_k": 5})
        assert response.status_code == 422

    def test_top_k_above_max_returns_422(self, client):
        response = client.post("/query", json={
            "question": "Where is the login function?",
            "top_k": 99
        })
        assert response.status_code == 422

    def test_top_k_below_min_returns_422(self, client):
        response = client.post("/query", json={
            "question": "Where is the login function?",
            "top_k": 0
        })
        assert response.status_code == 422

    def test_whitespace_only_question_returns_400(self, client):
        response = client.post("/query", json={
            "question": "     ",
            "top_k": 5
        })
        # Either 400 (sanitizer catches it) or 422 (pydantic catches it)
        assert response.status_code in [400, 422]

    def test_pipeline_exception_returns_500(self, client):
        with patch("src.api.routes.run_query_pipeline") as mock_pipeline:
            mock_pipeline.side_effect = Exception("Unexpected crash")
            response = client.post("/query", json={
                "question": "Where is the login function?",
                "top_k": 5
            })
        assert response.status_code == 500


# ── /health tests ─────────────────────────────────────────────────────────────

class TestHealthEndpoint:

    def test_health_returns_200(self, client):
        with patch("src.api.routes.get_connection"), \
             patch("src.api.routes.release_connection"), \
             patch("src.api.routes.get_collection_count", return_value=42):
            response = client.get("/health")
        assert response.status_code == 200

    def test_health_response_has_required_fields(self, client):
        with patch("src.api.routes.get_connection"), \
             patch("src.api.routes.release_connection"), \
             patch("src.api.routes.get_collection_count", return_value=0):
            response = client.get("/health")

        data = response.json()
        assert "status" in data
        assert "postgres" in data
        assert "vector_store" in data
        assert "chunks_indexed" in data
        assert "indexer_status" in data
