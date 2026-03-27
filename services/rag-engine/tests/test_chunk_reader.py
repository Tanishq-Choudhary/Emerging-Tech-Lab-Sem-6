import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone
from src.db.chunk_reader import fetch_chunks_since, fetch_all_chunks, ChunkRecord


# Sample raw DB row matching the SQL query column order
SAMPLE_ROW = (
    1,                      # chunk_id
    "src/auth.js",          # original_path
    "myrepo",               # repository_name
    "javascript",           # language
    "function login() {}",  # chunk_text
    10,                     # start_line
    25,                     # end_line
    "function",             # chunk_type
    "login",                # function_name
    None,                   # class_name
)


class TestFetchChunksSince:
    def test_returns_list_of_chunk_records(self):
        with patch("src.db.chunk_reader.get_connection") as mock_conn, \
             patch("src.db.chunk_reader.release_connection"):

            mock_cursor = MagicMock()
            mock_cursor.fetchall.return_value = [SAMPLE_ROW]
            mock_conn.return_value.__enter__ = MagicMock()
            mock_conn.return_value.cursor.return_value.__enter__ = \
                MagicMock(return_value=mock_cursor)
            mock_conn.return_value.cursor.return_value.__exit__ = \
                MagicMock(return_value=False)

            with patch("src.db.chunk_reader.get_connection") as mc, \
                 patch("src.db.chunk_reader.release_connection"):
                mock_cur = MagicMock()
                mock_cur.fetchall.return_value = [SAMPLE_ROW]
                mock_ctx = MagicMock()
                mock_ctx.__enter__ = MagicMock(return_value=mock_cur)
                mock_ctx.__exit__ = MagicMock(return_value=False)
                mock_connection = MagicMock()
                mock_connection.cursor.return_value = mock_ctx
                mc.return_value = mock_connection

                result = fetch_chunks_since(
                    datetime.fromtimestamp(0, tz=timezone.utc)
                )

                assert isinstance(result, list)
                assert len(result) == 1
                assert isinstance(result[0], ChunkRecord)

    def test_chunk_record_fields_map_correctly(self):
        with patch("src.db.chunk_reader.get_connection") as mc, \
             patch("src.db.chunk_reader.release_connection"):

            mock_cur = MagicMock()
            mock_cur.fetchall.return_value = [SAMPLE_ROW]
            mock_ctx = MagicMock()
            mock_ctx.__enter__ = MagicMock(return_value=mock_cur)
            mock_ctx.__exit__ = MagicMock(return_value=False)
            mock_connection = MagicMock()
            mock_connection.cursor.return_value = mock_ctx
            mc.return_value = mock_connection

            result = fetch_chunks_since(
                datetime.fromtimestamp(0, tz=timezone.utc)
            )
            record = result[0]

            assert record.chunk_id == 1
            assert record.original_path == "src/auth.js"
            assert record.repository_name == "myrepo"
            assert record.language == "javascript"
            assert record.chunk_text == "function login() {}"
            assert record.start_line == 10
            assert record.end_line == 25
            assert record.chunk_type == "function"
            assert record.function_name == "login"
            assert record.class_name is None

    def test_returns_empty_list_when_no_rows(self):
        with patch("src.db.chunk_reader.get_connection") as mc, \
             patch("src.db.chunk_reader.release_connection"):

            mock_cur = MagicMock()
            mock_cur.fetchall.return_value = []
            mock_ctx = MagicMock()
            mock_ctx.__enter__ = MagicMock(return_value=mock_cur)
            mock_ctx.__exit__ = MagicMock(return_value=False)
            mock_connection = MagicMock()
            mock_connection.cursor.return_value = mock_ctx
            mc.return_value = mock_connection

            result = fetch_chunks_since(
                datetime.now(tz=timezone.utc)
            )
            assert result == []

    def test_fetch_all_calls_fetch_since_with_epoch(self):
        with patch("src.db.chunk_reader.fetch_chunks_since") as mock_fetch:
            mock_fetch.return_value = []
            fetch_all_chunks()
            # fetch_all_chunks passes None to fetch_chunks_since
            # which internally converts it to epoch
            call_arg = mock_fetch.call_args[0][0]
            assert call_arg is None

