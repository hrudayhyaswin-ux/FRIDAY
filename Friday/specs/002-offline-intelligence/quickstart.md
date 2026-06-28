# Quickstart: Offline Intelligence Core

## Prerequisites

- Python 3.12+
- Node.js 20+
- Docker + docker-compose (optional, for containerized setup)
- Ollama (with at least one model pulled: `ollama pull phi3:mini`)
- Tesseract OCR (`apt install tesseract-ocr`)
- whisper.cpp (compiled binary)

## Setup

### 1. Clone and install

```bash
git clone <repo-url> friday-ai
cd friday-ai

# Backend
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Frontend
cd frontend
npm install
cd ..
```

### 2. Configure

```bash
cp config/env.example config/.env
# Edit config/.env as needed (defaults work out of the box)
```

### 3. Start backend

```bash
uvicorn backend.api.main:app --reload --port 8000
```

### 4. Start frontend

```bash
cd frontend
npm run dev
```

### 5. Open browser

Navigate to `http://localhost:3000`.

## Validation Scenarios

### Scenario A: Chat with local model

1. Ensure Ollama is running: `ollama serve`
2. Open the app at `http://localhost:3000`
3. Verify the model is detected (check Models page)
4. Send a message: "Hello, what can you do?"
5. **Expected**: Streaming response appears progressively. Response is
   generated locally (verify by disabling Wi-Fi).

### Scenario B: Upload and query a document

1. Navigate to the Upload page
2. Upload a PDF document
3. Wait for processing to complete (status → "ready")
4. Navigate to Chat and ask: "What is this document about?"
5. **Expected**: Answer references document content. Structured data
   (Summary, Entities, Action Items) appears on the Document page.

### Scenario C: Multi-format processing

1. Upload a text-containing image (screenshot, photo of text)
2. Upload an audio recording (meeting note, lecture)
3. **Expected**: Image OCR extracts text. Audio transcription produces
   text. Both become searchable and queryable.

### Scenario D: Semantic search

1. Upload 3+ documents with overlapping topics
2. Navigate to Documents page
3. Search for a concept that appears in multiple documents
4. **Expected**: Results from all relevant documents are returned, ranked
   by relevance. Selecting a result shows the source context.

### Scenario E: Offline verification

1. Disable Wi-Fi / disconnect network
2. Repeat Scenarios A-D
3. **Expected**: All functionality works identically. No errors related
   to network connectivity. No network requests in dev tools Network tab.

## Expected Outcomes

| Scenario | Outcome |
|----------|---------|
| A | Streaming chat response from local model |
| B | Document is parsed, indexed, and queryable |
| C | Image OCR and audio transcription succeed |
| D | Cross-document semantic search returns ranked results |
| E | All scenarios pass with networking disabled |

## Architecture References

- [Data Model](data-model.md) — entity definitions and relationships
- [API Contracts](contracts/) — endpoint specifications
- [Plan](plan.md) — implementation phases and timeline
