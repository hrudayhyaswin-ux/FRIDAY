# Research: Offline Intelligence Core

## Decision Log

### AI Runtime

- **Decision**: Ollama (primary LLM runtime)
- **Rationale**: Ollama provides a production-ready local inference server
  with model management, REST API, and streaming support. It wraps llama.cpp
  for CPU-optimized inference and supports the recommended models (Phi-3 Mini,
  Qwen2.5 3B).
- **Alternatives considered**: llama.cpp directly (more manual setup),
  llamafile (less ecosystem support), GPT4All (limited model support).

### Speech Recognition

- **Decision**: whisper.cpp
- **Rationale**: whisper.cpp offers fast CPU-optimized inference of OpenAI's
  Whisper models. It runs entirely locally, supports multiple languages, and
  has a small memory footprint on CPU.
- **Alternatives considered**: OpenAI Whisper (Python, slower on CPU),
  Vosk (less accurate), SpeechRecognition (cloud-dependent wrapper).

### OCR

- **Decision**: Tesseract OCR
- **Rationale**: Tesseract is the mature open-source OCR engine. It runs
  entirely locally, supports multiple languages, and integrates well with
  Python via pytesseract.
- **Alternatives considered**: EasyOCR (GPU-dependent, heavier),
  PaddleOCR (complex setup), cloud OCR APIs (not offline).

### Embeddings Model

- **Decision**: sentence-transformers (MiniLM-L6-v2)
- **Rationale**: MiniLM provides a strong quality-to-speed ratio for CPU
  inference. It produces 384-dimension embeddings suitable for FAISS,
  and runs efficiently without GPU.
- **Alternatives considered**: BERT (larger, slower on CPU), Instructor
  (larger), OpenAI embeddings (cloud-dependent).

### Vector Database

- **Decision**: FAISS (Facebook AI Similarity Search)
- **Rationale**: FAISS is the standard for local vector search. It runs
  entirely in-process, supports cosine similarity and L2 distance, and
  scales to millions of vectors on CPU.
- **Alternatives considered**: ChromaDB (heavier dependency), Qdrant
  (requires server process), SQLite + manual similarity (slow at scale).

### Database

- **Decision**: SQLite
- **Rationale**: SQLite is the ideal choice for a single-user offline
  application. Zero configuration, no server process, ACID compliance,
  and widespread Python support via aiosqlite or sqlite3.
- **Alternatives considered**: DuckDB (analytical focus, less ORM
  support), PostgreSQL (overkill for single-user, requires server).

### Document Parsing

- **Decision**: PyMuPDF (PDF), python-docx (DOCX)
- **Rationale**: PyMuPDF is the fastest pure-Python PDF parser with high
  accuracy. python-docx is the standard for .docx files. Both are
  lightweight and CPU-efficient.
- **Alternatives considered**: pdfplumber (slower), Apache Tika (Java
  dependency), Unstructured (heavy dependency tree).

### Frontend Framework

- **Decision**: Next.js + React + TailwindCSS + TypeScript
- **Rationale**: Next.js provides SSR/SSG with file-based routing,
  React for component model, TailwindCSS for utility-first styling, and
  TypeScript for type safety. This stack is well-suited for single-page
  web applications communicating with a FastAPI backend.
- **Alternatives considered**: Vue.js + Vite (smaller ecosystem for
  this project), Svelte (less tooling/maturity), plain HTML+JS (no
  component model).

### Backend Framework

- **Decision**: FastAPI (Python 3.12+)
- **Rationale**: FastAPI provides async support, automatic OpenAPI docs,
  Pydantic validation, WebSocket support, and excellent performance for
  I/O-bound workloads like streaming LLM responses.
- **Alternatives considered**: Flask (sync-only, no native WebSocket),
  Django (heavy for this scope), Node.js Express (different language
  stack).

### Streaming

- **Decision**: WebSocket for streaming responses, REST for CRUD
- **Rationale**: WebSocket provides bidirectional real-time communication
  essential for streaming LLM tokens. REST is simpler and more appropriate
  for CRUD operations on conversations, documents, and settings.
- **Alternatives considered**: Server-Sent Events (unidirectional only),
  long-polling (inefficient), gRPC (overkill for this scope).

### Chunking Strategy

- **Decision**: Recursive character text splitting with 512-token chunks
  and 64-token overlap
- **Rationale**: Recursive splitting preserves semantic boundaries
  (paragraphs, sentences) while maintaining consistent chunk sizes. 512
  tokens balances retrieval granularity with context window usage.
- **Alternatives considered**: Fixed-size chunks (may break mid-word),
  sentence-based (variable sizes), semantic chunking (more complex).

### RAG Pipeline

- **Decision**: Query → embed (MiniLM) → FAISS search (top-k=5) →
  retrieve chunks → prompt LLM with context → stream answer
- **Rationale**: Standard RAG architecture proven effective for document
  Q&A. Top-k=5 provides sufficient context without exceeding context
  windows on small models. Embedding on CPU is fast enough for interactive
  use.
- **Alternatives considered**: Re-rank step (adds latency), Hyde
  (hypothetical document embeddings, more complex), Graph RAG (overkill
  for MVP).
