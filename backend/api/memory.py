from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.db import get_db_connection
from typing import List

router = APIRouter()

class MemoryItem(BaseModel):
    key: str
    value: str

@router.get("")
def get_memories():
    """Retrieve all stored user facts/memories."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT key, value, timestamp FROM user_memory ORDER BY timestamp DESC")
        rows = cursor.fetchall()
        conn.close()
        
        return [{"key": row["key"], "value": row["value"], "created": row["timestamp"]} for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def add_memory(item: MemoryItem):
    """Add or update a memory fact."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO user_memory (key, value, timestamp) VALUES (?, ?, CURRENT_TIMESTAMP)",
            (item.key, item.value)
        )
        conn.commit()
        conn.close()
        return {"status": "success", "message": f"Memory '{item.key}' updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{key}")
def delete_memory(key: str):
    """Delete a memory fact by key."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM user_memory WHERE key = ?", (key,))
        conn.commit()
        conn.close()
        return {"status": "success", "message": f"Memory '{key}' deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
