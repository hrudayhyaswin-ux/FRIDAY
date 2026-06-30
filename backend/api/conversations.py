import logging
import uuid

from core.db import get_db_connection
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class ConversationCreate(BaseModel):
    title: str = "New Conversation"
    model: str = ""


class MessageAdd(BaseModel):
    role: str
    content: str


@router.get("/")
def list_conversations():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, title, model, created_at, updated_at, "
        "(SELECT COUNT(*) FROM conversation_messages WHERE conversation_id = id) as message_count "
        "FROM conversations ORDER BY updated_at DESC"
    )
    rows = cursor.fetchall()
    conn.close()
    return {
        "conversations": [
            {
                "id": row["id"],
                "title": row["title"],
                "model": row["model"],
                "message_count": row["message_count"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }
            for row in rows
        ]
    }


@router.post("/")
def create_conversation(body: ConversationCreate):
    conv_id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO conversations (id, title, model) VALUES (?, ?, ?)",
        (conv_id, body.title, body.model),
    )
    conn.commit()
    conn.close()
    return {"id": conv_id, "title": body.title, "model": body.model}


@router.get("/{conv_id}")
def get_conversation(conv_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
    conv = cursor.fetchone()
    if not conv:
        conn.close()
        raise HTTPException(status_code=404, detail="Conversation not found")
    cursor.execute(
        "SELECT role, content, created_at FROM conversation_messages WHERE conversation_id = ? ORDER BY id",
        (conv_id,),
    )
    messages = [{"role": r["role"], "content": r["content"], "created_at": r["created_at"]} for r in cursor.fetchall()]
    conn.close()
    return {
        "id": conv["id"],
        "title": conv["title"],
        "model": conv["model"],
        "messages": messages,
        "created_at": conv["created_at"],
        "updated_at": conv["updated_at"],
    }


@router.post("/{conv_id}/messages")
def add_message(conv_id: str, body: MessageAdd):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM conversations WHERE id = ?", (conv_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Conversation not found")
    cursor.execute(
        "INSERT INTO conversation_messages (conversation_id, role, content) VALUES (?, ?, ?)",
        (conv_id, body.role, body.content),
    )
    cursor.execute(
        "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (conv_id,),
    )
    conn.commit()
    conn.close()
    return {"status": "ok"}


@router.delete("/{conv_id}")
def delete_conversation(conv_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM conversation_messages WHERE conversation_id = ?", (conv_id,))
    cursor.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}
