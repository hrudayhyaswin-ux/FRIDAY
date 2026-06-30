# 🧠 FRIDAY AI — Personal Intelligence Suite

> **F**ully **R**esponsive **I**ntelligence **D**igital **A**ssistant for **Y**ou  
> A privacy-first ecosystem consisting of a Desktop Web Console, a FastAPI OS Controller, a futuristic Holographic HUD website, and an entirely standalone, on-device Mobile Application. Inspired by Iron Man's JARVIS.

---

## 🚀 The FRIDAY Ecosystem

FRIDAY is split into four core components designed to work together or run independently:

### 1. 🖥️ Desktop Web Console (`frontend/`)
A futuristic Next.js-based control dashboard featuring:
- **Neural Chat Interface**: Interactive text-to-speech chat console.
- **Cognitive Details**: Diagnostics on core temperature, CPU loads, and active vector databases.
- **SQLite Memory Manager**: Factual memories stored locally.
- **Document Indexer (RAG)**: Ingestion & querying of text files.

### 2. ⚙️ FastAPI Python OS Controller (`backend/`)
The local engine powering the desktop suite:
- **Local LLM Streaming**: Integrates with your local Ollama service.
- **Local Document RAG**: Ingests files using an advanced chunker, local embeddings, and vector store.
- **SQLite Memory Database**: Holds user facts that automatically influence the assistant's context.
- **Modular Mac Plugins**: Control Mac system volume, take screenshots, or launch apps via voice commands or console switchboards.

### 3. 🌟 Futuristic Holographic HUD Website (`website/`)
A gorgeous, standalone client running on HTML5 canvas and pure CSS/JS:
- **Atmospheric Visuals**: Retro-futuristic scanlines, ambient glare, and an active interactive neural network background.
- **Interactive Hologram Core**: Click the holographic orb to trigger the unique startup greeting: *"Hello Boss, welcome to FRIDAY, your personal AI assistant. All the files are ready to access. I am just one command away."*
- **JARVIS-Style Speech Output**: Streams incoming text and generates a crisp, snappier male voice synthesis with pitch/rate controls. Supports direct interruption by pressing Escape or tapping the orb.
- **Web Speech Recognition**: Translates mic audio to commands directly.

### 4. 📱 Standalone On-Device Mobile App (`mobile-app/`)
A cross-platform mobile application compiled for Android (APK) and iOS (IPA) using Capacitor:
- **Truly Standalone (No Mac/Internet Required)**: Runs a 1.1B Parameter local model (TinyLlama-1.1B) *directly on the mobile device GPU* using WebLLM.
- **Dual Mode Connectivity**:
  - **Connected AI Mode**: When on the same WiFi, the mobile app automatically links with your Mac's backend (`192.168.106.96:8000`) for full model capabilities.
  - **Standalone Offline Mode**: If disconnected, it falls back to the local TinyLlama model running entirely on-device.
- **Capacitor Native Plugins**: Utilizes `@capacitor-community/speech-recognition` for high-accuracy speech-to-text directly within the native Android WebView, coupled with robust fallback voice synthesis.

---

## 🏗️ Directory Structure

```text
FRIDAY-AI/
├── frontend/             # Next.js Web UI Console (React, Tailwind, TS)
│   ├── app/              # App Router Pages & Styles
│   └── components/       # Custom React Components
│
├── backend/              # FastAPI Python Web Server (Uvicorn, SQLite, FAISS)
│   ├── api/              # Route handlers (chat, status, memory, plugins)
│   ├── ai/               # Ollama connection & RAG pipeline
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
└── config/               # Settings & system files
```

---

## 📲 Getting Started

### Prerequisites
1. **Python 3.13+**
2. **Node.js 18+** & `npm`
3. **Ollama**: Installed and running locally.
   - Pull a model: `ollama pull phi3` or `ollama pull gemma2`

---

### 🖥️ Running Desktop Services

- [x] **Phase 1**: Basic Chat, Ollama Integration, local LLM streaming, futuristic Web UI dashboard.
- [ ] **Phase 2**: Voice integration (Whisper.cpp, Piper TTS, local interrupt handling).
- [ ] **Phase 3**: Long-term memory (SQLite factual logging, persistent state).
- [ ] **Phase 4**: Document RAG (PDF/DOCX extraction, local FAISS vector store).
- [ ] **Phase 5**: Modular plugin system & computer shell control.
- [ ] **Phase 6**: Computer Vision & OCR.

---

## CI/CD Pipeline

The project includes a GitLab CI pipeline with **13 automated checks** that run on every push. All jobs use real tooling — no stubs or pass-throughs.

| Stage          | Job                        | Tool         |
|----------------|----------------------------|--------------|
| Commit Lint    | Commit message validation  | `commitlint` |
| Python Lint    | Ruff lint                  | `ruff check` |
| Python Lint    | Ruff format                | `ruff format`|
| Frontend Lint  | ESLint                     | `eslint`     |
| Frontend Lint  | Prettier format check      | `prettier`   |
| Type Check     | MyPy (Python)              | `mypy`       |
| Type Check     | TypeScript (Frontend)      | `tsc`        |
| Security       | Bandit (Python SAST)       | `bandit`     |
| Security       | Secret detection            | `trufflehog` |
| Security       | Dependency audit           | `safety` + `npm audit` |
| Test           | Pytest + coverage          | `pytest`     |
| Build          | Backend Docker image       | `docker`     |
| Build          | Frontend Docker image      | `docker`     |

See [.gitlab-ci.yml](.gitlab-ci.yml) for full configuration and [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## Pre-commit Hooks

Install pre-commit hooks to run checks locally before committing:

```bash
pip install pre-commit
pre-commit install
pre-commit install --hook-type commit-msg
```

Hooks configured: `ruff`, `ruff-format`, `mypy`, `bandit`, `detect-secrets`, `prettier`, `eslint`, `commitlint`, trailing whitespace, YAML/JSON validation, merge-conflict detection, private-key detection.
