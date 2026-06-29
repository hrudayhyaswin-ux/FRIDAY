import os
import uuid
import json
import logging
import datetime
from typing import Dict, Any, List

from core.db import get_db_connection
from documents.parsers.pdf_parser import parse_pdf
from documents.parsers.docx_parser import parse_docx
from documents.parsers.text_parser import parse_text
from documents.ocr import perform_ocr
from documents.transcriber import transcribe_audio
from documents.chunker import chunk_text
from documents.embeddings import get_embedding
from memory.vector_store import vector_store
from documents.extraction.json_extractor import extract_all_knowledge

logger = logging.getLogger(__name__)

def process_document(file_path: str, filename: str) -> str:
    """
    Ingests and processes a document offline.
    Extracts text, chunks it, generates embeddings, stores chunks in SQLite & Vector index,
    performs structured knowledge extraction, and updates status.
    """
    doc_id = str(uuid.uuid4())
    ext = os.path.splitext(filename)[1].lower()
    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
    
    # 1. Insert initial document record in database
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO documents (id, filename, file_type, file_size, status, metadata, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ''', (doc_id, filename, ext, file_size, 'processing', json.dumps({})))
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to create document record: {e}")
        conn.close()
        raise e

    # 2. Extract text based on file format
    text = ""
    try:
        if ext == ".pdf":
            text = parse_pdf(file_path)
        elif ext in [".docx", ".doc"]:
            text = parse_docx(file_path)
        elif ext in [".txt", ".md"]:
            text = parse_text(file_path)
        elif ext in [".png", ".jpg", ".jpeg", ".tiff"]:
            text = perform_ocr(file_path)
        elif ext in [".wav", ".mp3", ".ogg", ".flac", ".m4a", ".webm"]:
            text = transcribe_audio(file_path)
        else:
            # Fallback text parsing
            text = parse_text(file_path)
            
        if not text or not text.strip():
            raise ValueError("No text could be extracted from this file.")
            
    except Exception as e:
        logger.error(f"Error parsing document {filename}: {e}")
        cursor.execute('''
            UPDATE documents 
            SET status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ''', ('failed', doc_id))
        conn.commit()
        conn.close()
        return doc_id

    # 3. Chunk text, generate embeddings, and store chunks
    try:
        chunks = chunk_text(text)
        chunk_ids = []
        doc_ids = []
        embeddings = []
        
        for idx, chunk in enumerate(chunks):
            chunk_id = str(uuid.uuid4())
            chunk_content = chunk["content"]
            token_count = chunk["token_count"]
            
            # Generate embedding vector
            vector = get_embedding(chunk_content)
            
            # Save chunk metadata to list for vector store batch insert
            chunk_ids.append(chunk_id)
            doc_ids.append(doc_id)
            embeddings.append(vector)
            
            # Save chunk to SQLite database
            cursor.execute('''
                INSERT INTO document_chunks (id, document_id, chunk_index, content, token_count, embedding_id)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (chunk_id, doc_id, idx, chunk_content, token_count, idx))
            
        # Insert all embeddings into FAISS/local vector store
        if embeddings:
            vector_store.add_embeddings(chunk_ids, doc_ids, embeddings)
            
        conn.commit()
    except Exception as e:
        logger.error(f"Error processing chunks for {filename}: {e}")
        cursor.execute('''
            UPDATE documents 
            SET status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ''', ('failed', doc_id))
        conn.commit()
        conn.close()
        return doc_id

    # 4. Extract structured knowledge (summary, entities, facts, action items)
    try:
        knowledge = extract_all_knowledge(text)
        know_id = str(uuid.uuid4())
        
        cursor.execute('''
            INSERT INTO extracted_knowledge (id, document_id, summary, entities, key_facts, action_items, structured_data, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ''', (
            know_id, 
            doc_id, 
            knowledge["summary"], 
            json.dumps(knowledge["entities"]), 
            json.dumps(knowledge["key_facts"]), 
            json.dumps(knowledge["action_items"]), 
            json.dumps(knowledge["structured_data"])
        ))
        
        # Update document status to ready
        cursor.execute('''
            UPDATE documents 
            SET status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ''', ('ready', doc_id))
        
        conn.commit()
    except Exception as e:
        logger.error(f"Error extracting knowledge for {filename}: {e}")
        # Mark as ready anyway but log error, since RAG is active
        cursor.execute('''
            UPDATE documents 
            SET status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ''', ('ready', doc_id))
        conn.commit()
        
    finally:
        conn.close()
        
    return doc_id

def delete_document(doc_id: str) -> bool:
    """Deletes a document, its chunks, embeddings, and structured knowledge from database & vector store."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if document exists
        cursor.execute("SELECT id FROM documents WHERE id = ?", (doc_id,))
        if not cursor.fetchone():
            return False
            
        # Delete from vector store (rebuilds the index)
        vector_store.delete_document_vectors(doc_id)
        
        # Delete from SQLite database (cascades to chunks and extracted_knowledge if foreign key delete is active)
        # Just to be safe, delete them explicitly
        cursor.execute("DELETE FROM extracted_knowledge WHERE document_id = ?", (doc_id,))
        cursor.execute("DELETE FROM document_chunks WHERE document_id = ?", (doc_id,))
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Failed to delete document {doc_id}: {e}")
        return False
    finally:
        conn.close()
