from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import json

from ai.ollama_client import llm_client
from core.config import settings

router = APIRouter()

class Message(BaseModel):
    role: str = Field(..., description="Role of the message author (system, user, assistant)")
    content: str = Field(..., description="Text content of the message")

class ChatRequest(BaseModel):
    model: Optional[str] = Field(None, description="The model name to use. Falls back to default if not provided.")
    messages: List[Message] = Field(..., description="The full conversation history")

class ModelInfo(BaseModel):
    name: str
    size: int
    details: Dict

@router.get("/status")
def get_status():
    """Check Ollama service status."""
    connected = llm_client.check_connection()
    return {
        "status": "online" if connected else "offline",
        "ollama_connected": connected,
        "ollama_host": settings.OLLAMA_HOST
    }

@router.get("/models", response_model=List[ModelInfo])
def get_models():
    """List available local LLMs."""
    models = llm_client.list_models()
    return models

@router.post("/chat")
def chat(request: ChatRequest):
    """Handle chat requests, streaming response chunks back to the client."""
    model = request.model or settings.DEFAULT_MODEL
    
    # Check if any model is available or Ollama is running
    if not llm_client.check_connection():
        raise HTTPException(
            status_code=503, 
            detail="Ollama service is unreachable. Please make sure Ollama is running locally."
        )
    
    # Map pydantic models to dicts for Ollama SDK
    formatted_messages = []
    
    # 1. Fetch user memories from local SQLite database
    system_prompt = (
        "You are FRIDAY, an advanced AI assistant — sharp, precise, and direct like JARVIS from Iron Man. "
        "ABSOLUTE RULE: Reply in 1-2 sentences MAXIMUM. No lists. No bullet points. No markdown. No explanations unless asked. "
        "Be confident, technical, and concise. Never pad your answer. Get straight to the point."
    )
    
    try:
        from core.db import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM user_memory")
        rows = cursor.fetchall()
        conn.close()
        
        if rows:
            memory_rules = "\n".join([f"- {row['key']}: {row['value']}" for row in rows])
            system_prompt += (
                f"\n\nHere is critical context and memory you know about the user:\n"
                f"{memory_rules}\n"
                "Incorporate these preferences and details naturally into your responses when relevant."
            )
    except Exception as e:
        # If DB fails, log it but proceed without memory context
        print(f"Memory retrieval failed: {e}")

    formatted_messages.append({"role": "system", "content": system_prompt})

    # 2. Append the actual conversation messages, injecting retrieval (RAG) context
    rag_context = ""
    try:
        if request.messages:
            last_msg = request.messages[-1]
            if last_msg.role == "user":
                from ai.rag_pipeline import query_rag
                # Query local document index
                matches = query_rag(last_msg.content, k=3)
                if matches:
                    rag_context = (
                        "Relevant excerpts from uploaded user documents:\n\n"
                        + "\n\n".join([f"[File: {m['filename']}] (Method: {m['method']}, Score: {m['score']:.2f})\n{m['text']}" for m in matches])
                        + "\n\nUse this data to answer the user query if helpful. Keep it factual."
                    )
    except Exception as e:
        print(f"RAG query lookup failed: {e}")

    # 3. Compile final message list for LLM engine
    for i, msg in enumerate(request.messages):
        content = msg.content
        # Inject constraint suffix to the last user message to enforce strict brevity
        if i == len(request.messages) - 1 and msg.role == "user":
            if rag_context:
                formatted_messages.append({"role": "system", "content": rag_context})
            content += "\n\n[SYSTEM OVERRIDE: You MUST reply in 1-2 sentences only. No lists. No markdown. Plain text only.]"
            
        formatted_messages.append({"role": msg.role, "content": content})
    
    def generate():
        for chunk in llm_client.chat_stream(model, formatted_messages):
            yield chunk

    return StreamingResponse(generate(), media_type="text/plain")
