import logging
import sqlite3

from ai.ollama_client import llm_client
from core.config import settings
from core.db import DB_PATH
from core.rag import rag_engine
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
def health_check():
    checks = {}

    try:
        checks["ollama"] = llm_client.check_connection()
    except Exception:
        checks["ollama"] = False

    try:
        models = llm_client.list_models()
        checks["models_available"] = len(models) > 0
        checks["model_count"] = len(models)
        if models:
            checks["default_model"] = settings.DEFAULT_MODEL
            checks["models"] = [m["name"] for m in models]
    except Exception:
        checks["models_available"] = False
        checks["model_count"] = 0

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        conn.close()
        checks["sqlite"] = True
        checks["tables"] = tables
    except Exception as e:
        checks["sqlite"] = False
        checks["sqlite_error"] = str(e)

    try:
        checks["faiss"] = len(rag_engine.chunks) >= 0
        checks["indexed_docs"] = len(rag_engine.filenames)
        checks["indexed_chunks"] = len(rag_engine.chunks)
    except Exception as e:
        checks["faiss"] = False
        checks["faiss_error"] = str(e)

    all_ok = checks.get("ollama", False) and checks.get("sqlite", False)

    return {
        "status": "ok" if all_ok else "degraded",
        "healthy": all_ok,
        "checks": checks,
    }
