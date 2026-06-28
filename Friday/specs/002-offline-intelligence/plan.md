# Implementation Plan: Offline Intelligence Core

**Branch**: `002-offline-intelligence` | **Date**: 2026-06-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from [spec.md](spec.md)

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

Build a fully offline, CPU-first AI web application that transforms
unstructured inputs (PDFs, images, audio, text, Markdown) into structured,
searchable knowledge. The MVP delivers document understanding via local
parsing, OCR, transcription, RAG-based Q&A, and structured extraction —
all running on CPU with no cloud dependency. Architecture prioritizes
modularity for future FRIDAY AI services.

## Technical Context

**Language/Version**: Python 3.12+ (backend), TypeScript (frontend)

**Primary Dependencies**: FastAPI, Next.js, React, TailwindCSS, Ollama,
whisper.cpp, Tesseract OCR, sentence-transformers, FAISS, SQLite, PyMuPDF,
python-docx

**Storage**: SQLite (conversations, documents, metadata), FAISS (vector
embeddings)

**Testing**: pytest (backend unit + integration), Jest + Testing Library
(frontend), Playwright (E2E)

**Target Platform**: Linux desktop/server (CPU), modern web browser
(Chrome/Firefox)

**Project Type**: Web application (frontend + backend), single-user

**Performance Goals**: Startup <10s; first streaming token <5s on target
hardware; PDF (10pp) → structured output <60s; semantic search across 10
docs <5s

**Constraints**: CPU-only inference (no GPU); fully offline (no cloud
calls); AGPL-3.0 licensed; all inference executes locally via Ollama +
whisper.cpp + sentence-transformers

**Scale/Scope**: Single-user personal knowledge base; document counts up
to hundreds; individual file sizes up to 100MB

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Rationale |
|-----------|--------|-----------|
| I. Offline First | ✅ PASS | All inference and storage is local; no cloud dependencies |
| II. Privacy by Design | ✅ PASS | No data leaves the device; no telemetry or cloud integrations |
| III. Modular Service Architecture | ✅ PASS | AI, Document, Memory services separated behind a Router |
| IV. Router-Centric Design | ✅ PASS | Architecture diagram shows Router coordinating all services |
| V. Deterministic System Actions | ✅ N/A | No OS-level actions in this feature |
| VI. Replaceable AI Components | ✅ PASS | Model abstraction layer isolates Ollama; future providers swappable |
| VII. Progressive Intelligence | ✅ PASS | Extraction → RAG → LLM ordering; lightweight ops before LLM |
| VIII. Multiple Memory Types | ✅ PASS | Conversation history, document metadata, and vector embeddings as separate stores |
| IX. Explainability | ✅ PASS | Structured outputs and pipeline steps are inspectable |
| X. Plugin First Expansion | ✅ PASS | API endpoints reserved for future plugins; documented interfaces |
| XI. Graceful Degradation | ✅ PASS | Model failures don't crash uploads; extraction works without LLM |
| XII. Performance on Commodity Hardware | ✅ PASS | CPU-only target; lightweight defaults (Phi-3 Mini, MiniLM) |
| XIII. Transparent Configuration | ✅ PASS | Config management in Phase 1; all settings in explicit files |
| XIV. Testability | ✅ PASS | Quality strategy mandates tests at all levels; CI enforces coverage |
| XV. Future Compatibility | ✅ PASS | Modular architecture; API-based service boundaries; extension points reserved |

No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-offline-intelligence/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── api-chat.md
│   ├── api-documents.md
│   ├── api-search.md
│   └── api-models.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
friday-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── chat/
│   │   │   ├── documents/
│   │   │   ├── upload/
│   │   │   └── settings/
│   │   └── services/
│   └── tests/
├── backend/
│   ├── api/
│   ├── router/
│   ├── ai/
│   ├── documents/
│   ├── memory/
│   ├── database/
│   └── utils/
├── models/
├── documents/
├── knowledge/
├── config/
├── tests/
├── scripts/
└── docker/
```

**Structure Decision**: Web application (Option 2) with `backend/` and
`frontend/` as independent deployable units. Service modules under
`backend/` map directly to the architecture diagram: `api/` (endpoints),
`router/` (request routing), `ai/` (LLM abstraction), `documents/`
(parsing/OCR/transcription), `memory/` (storage + retrieval).

## Complexity Tracking

> No constitution violations requiring justification.

## Implementation Phases

### Phase 1: Project Foundation

**Goal**: Create the project skeleton and development environment.

**Deliverables**:
- Repository structure with backend/ and frontend/
- Docker development environment (docker-compose)
- Backend: FastAPI app entry point, config management, logging, health
  endpoints
- Frontend: Next.js app scaffolded with TailwindCSS, TypeScript, base
  layout
- CI pipeline with formatting, linting, type checking, testing
- README, CONTRIBUTING, CHANGELOG, LICENSE (AGPL-3.0)

**Exit Criteria**: Application starts successfully; frontend connects to
backend health endpoint.

---

### Phase 2: Chat Core + AI Integration

**Goal**: Create the primary conversational interface integrated with local
LLMs.

**Deliverables**:
- Ollama integration with model abstraction layer
- Chat UI with message bubbles, input, send
- WebSocket-based streaming responses
- Conversation history with SQLite persistence
- Markdown rendering with syntax-highlighted code blocks
- Model selection UI (list available models, switch active model)
- Graceful error handling for model failures

**Exit Criteria**: Users can chat with locally running models via Ollama;
responses stream progressively; conversations persist across restarts.

---

### Phase 3: Document Intelligence

**Goal**: Transform uploaded files into structured, searchable knowledge.

**Deliverables**:
- Document upload API with progress feedback
- PDF parser (PyMuPDF), DOCX parser (python-docx), plain text parser
- OCR pipeline (Tesseract) for text-containing images
- Audio transcription (whisper.cpp)
- Text chunking with configurable strategies (size, overlap)
- Embeddings generation (sentence-transformers MiniLM)
- FAISS vector indexing
- RAG pipeline: embed query → search FAISS → retrieve chunks → LLM answer

**Exit Criteria**: Users can upload documents (PDF, images, audio) and
query their contents conversationally.

---

### Phase 4: Structured Extraction

**Goal**: Produce structured outputs from all document types.

**Deliverables**:
- JSON extraction of key-value pairs
- Automatic summarization
- Named entity recognition
- Key facts and action item extraction
- Metadata generation (document stats, page count, word count)
- Export extracted data as structured output

**Exit Criteria**: All supported documents generate structured information
(summaries, entities, action items, JSON, tables).

---

### Phase 5: Polish & Audit

**Goal**: Prepare for hackathon submission.

**Deliverables**:
- Responsive UI refinement (mobile + desktop)
- Offline verification with networking disabled
- Performance optimization (caching, async processing)
- Complete README with architecture docs
- CONTRIBUTING guide with development workflow
- CHANGELOG with version history
- Demo documentation and walkthrough script
- Local runner validation script

**Exit Criteria**: Repository satisfies all audit requirements; demo runs
with Wi-Fi disabled; all CI checks pass.
