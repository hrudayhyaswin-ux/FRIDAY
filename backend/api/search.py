import logging

from core.rag import rag_engine
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class SearchRequest(BaseModel):
    query: str
    top_k: int | None = 5


@router.post("/")
def search_documents(body: SearchRequest):
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    k = min(max(body.top_k or 5, 1), 20)
    results = rag_engine.query(body.query, k=k)
    return {
        "results": [
            {
                "document_name": r["filename"],
                "content": r["text"],
                "score": r["score"],
                "method": r.get("method", "semantic"),
            }
            for r in results
        ],
        "query": body.query,
    }
