import os
import uuid
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from core.rag import rag_engine

router = APIRouter()
logger = logging.getLogger(__name__)

class QueryRequest(BaseModel):
    query: str

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Uploads a document, parses it, and indexes it in the local RAG store."""
    temp_dir = "/tmp/friday_docs"
    os.makedirs(temp_dir, exist_ok=True)
    
    file_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
            
        success = rag_engine.add_document(file_path, file.filename)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to parse or extract text from the document.")
            
        return {
            "status": "success",
            "message": f"Successfully indexed '{file.filename}'",
            "chunks_count": len([c for c in rag_engine.chunks if c["filename"] == file.filename])
        }
    except Exception as e:
        logger.error(f"RAG upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.get("/files")
def list_documents():
    """Returns the names of all files currently indexed in memory."""
    return {"files": rag_engine.filenames}

@router.post("/query")
def query_documents(request: QueryRequest):
    """Returns the top matching context fragments for a custom query."""
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    results = rag_engine.query(request.query)
    return {"results": results}

@router.delete("/clear")
def clear_documents():
    """Wipes all document chunks from memory."""
    rag_engine.clear()
    return {"status": "success", "message": "All documents cleared from memory."}
