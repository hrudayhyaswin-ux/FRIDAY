# Changelog

## v0.2.0 — Offline Intelligence Core (2026-06-28)

### New Features

- **PWA (Progressive Web App)**
  - `manifest.json` with standalone display, SVG icons (192+512), cyan theme
  - Service worker with cache-first for Next.js static assets, network-first with offline shell fallback
  - `PWAInstallPrompt` component handling `beforeinstallprompt` event
  - `StartupWizard` animated boot screen polling `/api/v1/health`
  - Offline app shell HTML page rendered when network unavailable

- **Startup Health Checks**
  - `GET /api/v1/health` — verifies Ollama, SQLite, model availability, FAISS index
  - `BackendHealth` overlay when backend is unreachable (shows terminal commands)
  - `ModelSetupWizard` when no local models detected (recommends Phi-3, Qwen2.5, Gemma 3, Llama 3.2)

- **Unified Document Pipeline**
  - PDF, TXT, Markdown, DOCX, CSV — text extraction via PyMuPDF/python-docx
  - Image OCR via `pytesseract` + `Pillow` (PNG, JPG, GIF, BMP, TIFF, WebP)
  - Text chunking → Embeddings (Ollama `nomic-embed-text`) → FAISS cosine similarity search
  - Keyword fallback search when embeddings unavailable

- **Structured Extraction**
  - `GET /api/v1/docs/extract/{filename}` — LLM-powered extraction returning JSON:
    - Summary, Key Points, Named Entities, Dates, Organizations, Action Items, Metadata
  - Downloadable `.analysis.json` per document from the Document Intel tab

- **Semantic Search**
  - `POST /api/v1/search` — cross-document search ranked by relevance
  - Dedicated "Semantic Search" tab in the UI

- **Conversations Persistence**
  - `conversations` and `conversation_messages` SQLite tables
  - `POST/GET/DELETE /api/v1/conversations` — full CRUD API
  - Conversation list toggle in chat header, create/load/save conversations

- **System Status Widget**
  - Always-visible `OfflineStatus` bar (Runtime, LLM, Backend, Internet statuses)
  - "Offline Ready" indicator

- **Cross-Platform TTS**
  - macOS: `say` command + ffmpeg
  - Linux: `espeak-ng` / `espeak` fallback

### Changed

- **Database**: Renamed from `friday_memory.db` to `friday.db` (matches `.gitignore`)
- **Database schema**: Added `documents`, `conversations`, `conversation_messages` tables
- **Config**: Added `EMBED_MODEL`, `DB_PATH`, `DOCS_DIR`, `STT_DIR` settings
- **Dependencies**: Added `numpy`, `pypdf`, `python-docx`, `Pillow`, `pytesseract`
- **Lint rules**: Allow `any` in catch clauses, ignore unused vars with `_` prefix
- **CSS**: Added `@keyframes fade-in` animation

### Fixed

- **manifest.json**: Broken JSON (line 8 had orphaned `primary"` string)
- **MarkdownRenderer.tsx**: Type error (`str` → `string`)
- **Catch blocks**: TypeScript strict mode compliance with `errMsg()` helper

---

## v0.1.0 — Original Features (Initial)

### Backend (FastAPI)

- **Chat API** (`/api/v1/chat`)
  - Streaming responses from local Ollama models
  - Automatic memory context injection from SQLite
  - RAG context injection from uploaded documents
- **Speech API** (`/api/v1/speech`)
  - `POST /transcribe` — Whisper STT (tiny model, lazy-loaded)
  - `POST /synthesize` — macOS TTS via `say` + ffmpeg
- **Memory API** (`/api/v1/memory`)
  - CRUD for key-value memory facts in SQLite
  - Persistent across sessions
- **Documents API** (`/api/v1/docs`)
  - Upload, list, query, and clear indexed documents
  - RAG engine with text extraction, chunking, and cosine similarity
- **Plugins API** (`/api/v1/plugins`)
  - Volume, mute/unmute, app launcher, screenshot, system stats
  - macOS-specific automation via `osascript`/`screencapture`/`psutil`

### Frontend (Next.js App Router)

- **Single-page application** with 5 tabs: Neural Chat, Document Intel, SQLite Memory, Modular Plugins, System Status
- **Chat interface** with streaming Markdown rendering
- **Document upload** (PDF, DOCX, TXT, CSV, MD)
- **Voice recording** via MediaRecorder + Whisper transcription
- **Memory CRUD** table
- **Plugin controls** (volume slider, mute/unmute, open app, screenshot, system stats)
- **System status panels** (Ollama health, model list, execution mode)
- **Dark futuristic UI** with glassmorphism, pulsing orbs, gradient accents
- **Configurable API base URL** via `localStorage`
- **Geist font**, Tailwind CSS v4, Lucide icons

### AI Runtime

- **Ollama** integration for LLM chat and embeddings
- **whisper.cpp** (via `openai-whisper` Python package) for speech-to-text
- **LocalRAG engine** with in-memory chunk/embedding store
- **SQLite** for conversation history and user memory

### Architecture

- Offline-first: all APIs on `localhost:8000`, CORS restricted to local origins
- No cloud dependencies — everything runs on CPU
- Singleton `LocalLLMClient` and `LocalRAG` engine
- Environment-based configuration via `core/config.py`

### Build & Quality

- TypeScript strict mode enabled
- Tailwind CSS v4 with PostCSS
- ESLint with Next.js core-web-vitals + TypeScript rules
