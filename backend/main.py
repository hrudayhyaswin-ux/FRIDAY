import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add the current directory to python path to resolve imports correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.config import settings
from api.chat import router as chat_router
from api.speech import router as speech_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Offline-first personal AI assistant",
    version="0.1.0"
)

# Set up CORS middleware to allow the frontend to interact with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all. In production, restrict this.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(chat_router, prefix=settings.API_V1_STR, tags=["chat"])
app.include_router(speech_router, prefix=settings.API_V1_STR + "/speech", tags=["speech"])

@app.get("/")
def read_root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} Backend API",
        "api_docs": "/docs",
        "status": "active"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
