import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from unittest.mock import patch, MagicMock
from src.embeddings.embedder import embed_query, embed_documents, QUERY_PREFIX, DOCUMENT_PREFIX


class TestEmbedQuery:
    def test_returns_list_of_floats(self):
        result = embed_query("Where is the login function?")
        assert isinstance(result, list)
        assert all(isinstance(x, float) for x in result)

    def test_output_dimension_is_768(self):
        # BGE-base produces 768-dimensional embeddings
        result = embed_query("Where is the login function?")
        assert len(result) == 768

    def test_query_prefix_is_applied(self):
        with patch("src.embeddings.embedder.get_model") as mock_get_model:
            import numpy as np
            mock_model = MagicMock()
            mock_model.encode.return_value = np.array([0.1] * 768)
            mock_get_model.return_value = mock_model

            embed_query("test question")

            call_args = mock_model.encode.call_args[0][0]
            assert call_args.startswith(QUERY_PREFIX)

    def test_different_questions_produce_different_embeddings(self):
        emb1 = embed_query("Where is the login function?")
        emb2 = embed_query("How is the database connection managed?")
        assert emb1 != emb2


class TestEmbedDocuments:
    def test_adds_embedding_key_to_each_chunk(self):
        chunks = [
            {
                "chunk_id": "1",
                "chunk_text": "def login(req, res): pass",
                "original_path": "src/auth.js",
                "function_name": "login",
                "class_name": None,
                "repository_name": "myrepo",
            }
        ]
        result = embed_documents(chunks)
        assert "embedding" in result[0]
        assert isinstance(result[0]["embedding"], list)
        assert len(result[0]["embedding"]) == 768

    def test_document_prefix_is_applied(self):
        with patch("src.embeddings.embedder.get_model") as mock_get_model:
            mock_model = MagicMock()
            import numpy as np
            mock_model.encode.return_value = np.array([[0.1] * 768])
            mock_get_model.return_value = mock_model

            chunks = [{
                "chunk_id": "1",
                "chunk_text": "def login(): pass",
                "original_path": "src/auth.js",
                "function_name": "login",
                "class_name": None,
                "repository_name": "myrepo",
            }]
            embed_documents(chunks)

            encoded_text = mock_model.encode.call_args[0][0][0]
            assert encoded_text.startswith(DOCUMENT_PREFIX)

    def test_context_header_includes_file_and_function(self):
        with patch("src.embeddings.embedder.get_model") as mock_get_model:
            mock_model = MagicMock()
            import numpy as np
            mock_model.encode.return_value = np.array([[0.1] * 768])
            mock_get_model.return_value = mock_model

            chunks = [{
                "chunk_id": "1",
                "chunk_text": "def login(): pass",
                "original_path": "src/auth.js",
                "function_name": "login",
                "class_name": None,
                "repository_name": "myrepo",
            }]
            embed_documents(chunks)

            encoded_text = mock_model.encode.call_args[0][0][0]
            assert "src/auth.js" in encoded_text
            assert "login" in encoded_text

    def test_handles_multiple_chunks(self):
        chunks = [
            {
                "chunk_id": str(i),
                "chunk_text": f"function_{i}() {{}}",
                "original_path": f"src/file_{i}.js",
                "function_name": f"function_{i}",
                "class_name": None,
                "repository_name": "myrepo",
            }
            for i in range(5)
        ]
        result = embed_documents(chunks)
        assert len(result) == 5
        assert all("embedding" in c for c in result)
