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
    formatted_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    
    def generate():
        for chunk in llm_client.chat_stream(model, formatted_messages):
            yield chunk

    return StreamingResponse(generate(), media_type="text/plain")
