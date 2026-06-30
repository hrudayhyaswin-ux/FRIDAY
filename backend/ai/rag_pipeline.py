import logging
from typing import Any

from core.db import get_db_connection
from documents.embeddings import get_embedding
from memory.vector_store import vector_store

logger = logging.getLogger(__name__)


def query_rag(query_text: str, k: int = 5) -> list[dict[str, Any]]:
    """
    Queries the persistent vector store using semantic search and fetches
    the matching chunk text from the SQLite database.
    """
    if not query_text or not query_text.strip():
        return []

    # 1. Generate embedding for query
    query_vector = get_embedding(query_text)

    # 2. Search in vector store
    # Search returns list of (chunk_id, document_id, score)
    matches = vector_store.search(query_vector, k=k)

    if not matches:
        # Fallback to keyword-based search on SQLite if vector store is empty
        return _keyword_search_fallback(query_text, k)

    # 3. Retrieve chunk text from database
    results = []
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        for chunk_id, _, score in matches:
            cursor.execute(
                """
                SELECT dc.content, d.filename
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                WHERE dc.id = ?
            """,
                (chunk_id,),
            )
            row = cursor.fetchone()
            if row:
                results.append(
                    {
                        "filename": row["filename"],
                        "text": row["content"],
                        "score": score,
                        "method": "semantic",
                    }
                )
    except Exception as e:
        logger.error(f"Error fetching RAG chunks from database: {e}")
    finally:
        conn.close()

    return results


def _keyword_search_fallback(query: str, k: int = 5) -> list[dict[str, Any]]:
    """Simple keyword matching fallback over all chunks in SQLite."""
    logger.info("Executing database keyword-search fallback...")
    words = [w.lower() for w in query.split() if len(w) > 2]
    if not words:
        return []

    conn = get_db_connection()
    cursor = conn.cursor()
    results = []

    try:
        # Build wildcard query
        like_clauses = " OR ".join(["dc.content LIKE ?" for _ in words])
        params = [f"%{w}%" for w in words]

        cursor.execute(
            f"""
            SELECT dc.content, d.filename
            FROM document_chunks dc
            JOIN documents d ON dc.document_id = d.id
            WHERE {like_clauses}
            LIMIT 20
        """,
            params,
        )

        rows = cursor.fetchall()

        # Score rows based on word overlap count
        scored_results = []
        query_words_set = set(words)
        for row in rows:
            content_words = set(row["content"].lower().split())
            overlap = len(query_words_set.intersection(content_words))
            if overlap > 0:
                scored_results.append(
                    {
                        "filename": row["filename"],
                        "text": row["content"],
                        "score": float(overlap) / len(query_words_set),
                        "method": "keyword",
                    }
                )

        # Sort and take top k
        scored_results.sort(key=lambda x: x["score"], reverse=True)
        results = scored_results[:k]
    except Exception as e:
        logger.error(f"Keyword search fallback failed: {e}")
    finally:
        conn.close()

    return results
