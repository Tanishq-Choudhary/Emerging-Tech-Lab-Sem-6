import psycopg2
from psycopg2 import pool
import os
from dotenv import load_dotenv

load_dotenv()

_connection_pool = None

def get_pool():
    global _connection_pool
    if _connection_pool is None:
        _connection_pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            host=os.getenv("POSTGRES_HOST", "postgres"),
            port=int(os.getenv("POSTGRES_PORT", 5432)),
            dbname=os.getenv("POSTGRES_DB", "codeatlas"),
            user=os.getenv("POSTGRES_USER", "codeatlas"),
            password=os.getenv("POSTGRES_PASSWORD", ""),
        )
    return _connection_pool

def get_connection():
    return get_pool().getconn()

def release_connection(conn):
    get_pool().putconn(conn)

def close_pool():
    global _connection_pool
    if _connection_pool:
        _connection_pool.closeall()
        _connection_pool = None
        print("[db] Connection pool closed.")
