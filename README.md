# FRIDAY AI

A fully offline, CPU-powered AI voice and text assistant built for privacy, speed, and intelligence.

FRIDAY AI is an offline-first personal assistant inspired by Iron Man's virtual assistants. Unlike cloud-based solutions, FRIDAY runs entirely on your local machine, keeping all user data secure and private.

## Architecture & Tech Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS, TypeScript, Lucide Icons
- **Backend**: Python 3.13, FastAPI, Uvicorn, Ollama Python SDK
- **Local AI Engine**: Ollama (phi3, gemma2, etc.)

---

## Directory Structure

```text
FRIDAY-AI/
├── frontend/             # Next.js Web UI Console
│   ├── app/              # App Router Pages & Styles
│   ├── components/       # Custom React Components
│   └── public/           # Static assets
│
├── backend/              # FastAPI Python Web Server
│   ├── api/              # Route handlers (chat, status, models)
│   ├── ai/               # Ollama connection & streaming wrapper
│   ├── core/             # Settings and configuration
│   └── venv/             # Python virtual environment
│
├── website/              # Futuristic Holographic HUD desktop website
│   ├── index.html        # Main HUD interface
│   ├── app.js            # HUD controller logic (voice synth/recognition, UI)
│   └── canvas.js         # Animated background neural network & core
│
├── mobile-app/           # Standalone On-Device Mobile App (Android/iOS)
│   ├── www/              # Mobile web assets (WebLLM TinyLlama on-device AI)
│   ├── android/          # Android native Capacitor project
│   └── ios/              # iOS native Capacitor project
│
├── models/               # Local LLMs / model configs
├── documents/            # Target folders for Document Intel (RAG)
├── config/               # Settings & system files
└── README.md             # This file
```

---

## Getting Started

### Prerequisites

1. **Python 3.13+**
2. **Node.js 18+** & `npm`
3. **Ollama**: Installed and running on your system.
   - Install from [ollama.com](https://ollama.com)
   - Download a recommended model:
     ```bash
     ollama pull phi3
     # or
     ollama pull gemma2
     ```

### Backend Setup & Execution

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```
3. Install dependencies (if not already done):
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   python main.py
   ```
   *The backend will be available at `http://localhost:8000` (API Docs at `/docs`).*

### Frontend Setup & Execution

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   *The Web Console will be available at `http://localhost:3000`.*

---

## Roadmap

- [x] **Phase 1**: Basic Chat, Ollama Integration, local LLM streaming, futuristic Web UI dashboard.
- [ ] **Phase 2**: Voice integration (Whisper.cpp, Piper TTS, local interrupt handling).
- [ ] **Phase 3**: Long-term memory (SQLite factual logging, persistent state).
- [ ] **Phase 4**: Document RAG (PDF/DOCX extraction, local FAISS vector store).
- [ ] **Phase 5**: Modular plugin system & computer shell control.
- [ ] **Phase 6**: Computer Vision & OCR.
