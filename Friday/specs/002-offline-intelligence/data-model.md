# Data Model: Offline Intelligence Core

## Overview

The system uses SQLite for relational data (conversations, messages,
documents, settings) and FAISS for vector embeddings (semantic search).

## Entities

### Conversation

A persistent thread of messages between the user and the assistant.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (PK) | Unique identifier |
| `title` | TEXT | Auto-generated or user-provided title |
| `model_id` | TEXT | The active model used for this conversation |
| `created_at` | DATETIME | When the conversation was started |
| `updated_at` | DATETIME | When the last message was exchanged |

**Relationships**: Has many Messages. Belongs to zero or one Document
context.

---

### Message

A single exchange within a conversation.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (PK) | Unique identifier |
| `conversation_id` | UUID (FK → Conversation) | Parent conversation |
| `role` | TEXT | `user` or `assistant` |
| `content` | TEXT | Message body (Markdown) |
| `edited` | BOOLEAN | Whether the user edited this message |
| `created_at` | DATETIME | When the message was sent |

**Validation**: `role` must be `user` or `assistant`. `content` must not
be empty for `user` messages. `assistant` messages may be empty during
streaming (partial).

---

### Document

An uploaded file processed by the system.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (PK) | Unique identifier |
| `filename` | TEXT | Original filename |
| `file_type` | TEXT | MIME type or extension |
| `file_size` | INTEGER | Size in bytes |
| `status` | TEXT | `uploaded`, `processing`, `ready`, `failed` |
| `metadata` | JSON | Extracted metadata (page count, duration, etc.) |
| `created_at` | DATETIME | Upload timestamp |
| `updated_at` | DATETIME | Last processing timestamp |

**Valid file types**: `application/pdf`, `text/plain`, `text/markdown`,
`image/png`, `image/jpeg`, `image/tiff`, `audio/wav`, `audio/mpeg`,
`audio/ogg`, `audio/flac`.

**State transitions**: `uploaded` → `processing` → `ready` | `failed`.

---

### DocumentChunk

A segmented portion of a document used for semantic retrieval.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (PK) | Unique identifier |
| `document_id` | UUID (FK → Document) | Source document |
| `index` | INTEGER | Chunk position (0-based) |
| `content` | TEXT | Chunk text |
| `token_count` | INTEGER | Approximate token count |
| `embedding_id` | INTEGER | FAISS vector index ID |

---

### ExtractedKnowledge

Structured information produced from a document.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (PK) | Unique identifier |
| `document_id` | UUID (FK → Document, UNIQUE) | Source document |
| `summary` | TEXT | Document summary |
| `entities` | JSON | Named entities (person, place, org, date) |
| `key_facts` | JSON | Key facts and claims |
| `action_items` | JSON | Action items extracted |
| `structured_data` | JSON | Key-value pairs, tables |
| `created_at` | DATETIME | Extraction timestamp |

---

### Settings

Application configuration persisted across sessions.

| Field | Type | Description |
|-------|------|-------------|
| `key` | TEXT (PK) | Setting name |
| `value` | TEXT | Setting value (JSON-encoded) |

**Well-known keys**: `active_model`, `theme`, `chunk_size`,
`chunk_overlap`, `top_k_retrieval`, `temperature`.

## Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| messages | idx_messages_conversation | conversation_id, created_at | Fast conversation loading |
| documents | idx_documents_status | status | Filter by processing state |
| document_chunks | idx_chunks_document | document_id, index | Ordered chunk retrieval |

## FAISS Vector Store

The FAISS index is stored on disk at `knowledge/vectors.index`. An
associated mapping file `knowledge/vectors.map` maps FAISS vector IDs
to `document_chunks.id` and `document_id` for result traceability.

**Index type**: `IndexFlatIP` (inner product = cosine similarity on
normalized vectors). Dimension: 384 (MiniLM-L6-v2 output).

**Retrieval**: Top-k=5 by default. Results include chunk content,
source document reference, and similarity score.
