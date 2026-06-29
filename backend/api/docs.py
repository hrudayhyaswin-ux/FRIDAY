import os
import uuid
import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel

from core.db import get_db_connection
from documents.service import process_document, delete_document
from ai.rag_pipeline import query_rag

router = APIRouter()
logger = logging.getLogger(__name__)

class QueryRequest(BaseModel):
    query: str
    k: Optional[int] = 5

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...)):
    """Uploads a document for parsing, chunking, and embedding."""
    temp_dir = "/tmp/friday_docs"
    os.makedirs(temp_dir, exist_ok=True)
    
    file_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")
    try:
        # Save file to temp location
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
            
        # Process the document using the offline pipeline
        doc_id = process_document(file_path, file.filename)
        
        # Query metadata of document to return
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, filename, file_type, file_size, status, created_at FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        
        # Count chunks
        cursor.execute("SELECT COUNT(*) FROM document_chunks WHERE document_id = ?", (doc_id,))
        chunks_count = cursor.fetchone()[0]
        conn.close()
        
        if not row:
            raise HTTPException(status_code=500, detail="Document insertion failed.")
            
        return {
            "id": row["id"],
            "filename": row["filename"],
            "file_type": row["file_type"],
            "file_size": row["file_size"],
            "status": row["status"],
            "chunks_count": chunks_count,
            "created_at": row["created_at"]
        }
    except Exception as e:
        logger.error(f"Failed to upload and process document: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.get("")
def list_documents():
    """Lists all uploaded documents with status and metadata."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check has_structured_data by matching with extracted_knowledge table
        cursor.execute('''
            SELECT d.id, d.filename, d.file_type, d.file_size, d.status, d.created_at,
                   (CASE WHEN ek.document_id IS NOT NULL THEN 1 ELSE 0 END) as has_structured_data
            FROM documents d
            LEFT JOIN extracted_knowledge ek ON d.id = ek.document_id
            ORDER BY d.created_at DESC
        ''')
        rows = cursor.fetchall()
        
        documents = []
        for r in rows:
            documents.append({
                "id": r["id"],
                "filename": r["filename"],
                "file_type": r["file_type"],
                "file_size": r["file_size"],
                "status": r["status"],
                "has_structured_data": bool(r["has_structured_data"]),
                "created_at": r["created_at"]
            })
        return {"documents": documents}
    except Exception as e:
        logger.error(f"Failed to list documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/{id}")
def get_document_details(id: str):
    """Retrieves detailed information and extracted structured knowledge for a document."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Fetch document
        cursor.execute("SELECT id, filename, file_type, file_size, status, metadata, created_at FROM documents WHERE id = ?", (id,))
        doc = cursor.fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
            
        # Fetch extracted knowledge
        cursor.execute('''
            SELECT summary, entities, key_facts, action_items, structured_data 
            FROM extracted_knowledge 
            WHERE document_id = ?
        ''', (id,))
        knowledge_row = cursor.fetchone()
        
        extracted_knowledge = {
            "summary": None,
            "entities": [],
            "key_facts": [],
            "action_items": [],
            "structured_data": {}
        }
        
        if knowledge_row:
            try:
                extracted_knowledge = {
                    "summary": knowledge_row["summary"],
                    "entities": json.loads(knowledge_row["entities"]) if knowledge_row["entities"] else [],
                    "key_facts": json.loads(knowledge_row["key_facts"]) if knowledge_row["key_facts"] else [],
                    "action_items": json.loads(knowledge_row["action_items"]) if knowledge_row["action_items"] else [],
                    "structured_data": json.loads(knowledge_row["structured_data"]) if knowledge_row["structured_data"] else {}
                }
            except Exception as je:
                logger.error(f"Error parsing JSON from database row: {je}")
                
        doc_metadata = {}
        if doc["metadata"]:
            try:
                doc_metadata = json.loads(doc["metadata"])
            except Exception:
                pass
                
        return {
            "id": doc["id"],
            "filename": doc["filename"],
            "file_type": doc["file_type"],
            "file_size": doc["file_size"],
            "status": doc["status"],
            "metadata": doc_metadata,
            "extracted_knowledge": extracted_knowledge,
            "created_at": doc["created_at"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving document {id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document_endpoint(id: str):
    """Deletes a document and clears all associated text chunks, embeddings, and summary knowledge."""
    success = delete_document(id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found or could not be deleted")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/query")
def query_documents(request: QueryRequest):
    """Returns the top matching context fragments for a custom query across all documents."""
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    results = query_rag(request.query, k=request.k)
    return {"results": results}

@router.delete("/clear")
def clear_documents():
    """Wipes all documents and vectors from the system database and index."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM extracted_knowledge")
        cursor.execute("DELETE FROM document_chunks")
        cursor.execute("DELETE FROM documents")
        conn.commit()
        
        # Clear vector index
        from memory.vector_store import vector_store
        vector_store.clear()
        
        return {"status": "success", "message": "All documents and vector indices successfully wiped."}
    except Exception as e:
        logger.error(f"Error clearing documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/files")
def list_files_compatibility():
    """Compatibility endpoint returning a list of filenames for older frontend builds."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT filename FROM documents ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return {"files": [r["filename"] for r in rows]}
    except Exception as e:
        logger.error(f"Failed to list files: {e}")
        return {"files": []}
    finally:
        conn.close()
