# FRIDAY AI - Agent Guidelines & Coding Standards

Welcome, agent. This repository contains the source code for **FRIDAY AI**, an offline-first, CPU-powered personal AI voice and text assistant. 

Please read and adhere to these guidelines when making modifications to this codebase.

---

## Directory Architecture

- `/backend` - FastAPI Python 3.13 application.
  - `/api` - API endpoints (CORS enabled, tags configured).
  - `/ai` - Local LLM interfaces (Ollama, llama.cpp).
  - `/core` - Application settings and global environment configuration.
- `/frontend` - Next.js (App Router) TypeScript web dashboard.
  - `/app` - Web pages and layout components.
  - `/components` - Modular frontend widgets (e.g., `MarkdownRenderer`).
- `/specs` - Architecture designs, specifications, contracts, and roadmap feature checklists.

---

## General Instructions

### 1. Offline-First Mandate
- **Strict Privacy constraint**: FRIDAY runs 100% locally. Never introduce dependencies, API calls, or trackers that connect to external clouds (e.g., OpenAI, external analytics, CDNs) unless requested explicitly.
- All models (LLMs, Whisper speech recognition, Piper text-to-speech, Sentence Transformers embeddings) must be executed locally on the host's CPU.

### 2. Backend Coding Standards (Python / FastAPI)
- **Virtual Environment**: Always use the virtual environment `./backend/venv/bin/python` to run tests or launch commands.
- **Port mapping**: The backend runs on `http://localhost:8000`.
- **CORS configuration**: Ensure CORS middleware in `main.py` is configured to allow connection from the frontend.
- **Streaming endpoints**: Always prefer streaming (`StreamingResponse`) for generating LLM text responses to minimize latency.
- **Error Handling**: Standardize error returns. If Ollama or the local models are offline, return standard 503 HTTP codes rather than failing silently.

### 3. Frontend Coding Standards (Next.js / Tailwind CSS v4)
- **Port mapping**: The Next.js dev server runs on `http://localhost:3000`.
- **Tailwind Version**: Built with Tailwind CSS v4. Use `@import "tailwindcss"` in `globals.css` and inline/class utilities in TSX components.
- **Aesthetic standard**: Keep the styling dark, futuristic, and holographic (glassmorphism, subtle glowing rings/orbs, smooth fade-in micro-animations). Avoid raw white backgrounds or standard generic primary buttons.
- **Client Components**: Mark pages requiring UI interaction, hooks (`useState`, `useEffect`), or Web APIs (speech audio, mic access) with `"use client"`.

### 4. Git Hygiene
- Avoid committing binary models (GGUF), raw documents (PDFs), or local SQLite databases (`friday.db`).
- Check `.gitignore` to ensure paths like `**/__pycache__/` and `node_modules/` are strictly ignored.
