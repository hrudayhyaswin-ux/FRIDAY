# Tasks: Offline Intelligence Core

**Input**: Design documents from `specs/002-offline-intelligence/`

**Prerequisites**: plan.md (required), spec.md (required for user stories),
research.md, data-model.md, contracts/

**Tests**: Test tasks are included — write tests before implementation
(Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/` at repository root
- **Frontend**: `frontend/` at repository root
- **Tests**: `tests/` at repository root (backend), `frontend/tests/` (frontend)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize repository structure with backend/ and frontend/ directories
- [ ] T002 [P] Configure Next.js frontend with TailwindCSS and TypeScript in frontend/
- [ ] T003 [P] Configure FastAPI backend with Python 3.12+ in backend/
- [ ] T004 Set up shared configuration and environment management in config/
- [ ] T006 Write README with architecture, setup instructions, offline workflow, and CPU-first design
- [ ] T007 [P] Create CONTRIBUTING, CHANGELOG, and LICENSE (AGPL-3.0) files

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story
can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create SQLite database schema in backend/database/schema.py
- [ ] T037 [P] Configure pre-commit hooks in .pre-commit-config.yaml
- [ ] T038 [P] Configure formatting checks in pyproject.toml
- [ ] T039 [P] Configure linting in .ruff.toml
- [ ] T040 [P] Configure static type checking in pyproject.toml
- [ ] T041 [P] Configure dependency vulnerability scanning in .trivyignore
- [ ] T042 [P] Configure secret scanning with detect-secrets in .secrets.baseline
- [ ] T043 [P] Configure license verification in license-checker config
- [ ] T044 [P] Configure Markdown validation with markdownlint in .markdownlint.yaml
- [ ] T045 [P] Configure documentation validation in CI pipeline
- [ ] T046 [P] Configure semantic commit validation with commitlint in commitlint.config.js

**Checkpoint**: Foundation ready - user story implementation can now begin
in parallel

---

## Phase 3: User Story 1 - Document Upload and Structured Extraction (Priority: P1) 🎯 MVP

**Goal**: Users upload documents (PDF, DOCX, TXT, MD) and receive structured
outputs (JSON, summaries, entities, action items) entirely offline.

**Independent Test**: Upload a PDF document and verify structured output
(summary, named entities, action items) is returned without any network
activity.

### Implementation for User Story 1

- [x] T015 [US1] Implement PDF parser using PyMuPDF in backend/documents/parsers/pdf_parser.py
- [x] T016 [P] [US1] Implement DOCX parser using python-docx in backend/documents/parsers/docx_parser.py
- [x] T017 [P] [US1] Implement TXT and Markdown parser in backend/documents/parsers/text_parser.py
- [x] T020 [US1] Implement text chunking pipeline in backend/documents/chunker.py
- [x] T021 [P] [US1] Generate embeddings using sentence-transformers MiniLM in backend/documents/embeddings.py
- [x] T022 [P] [US1] Store embeddings in FAISS vector index in backend/memory/vector_store.py
- [x] T024 [US1] Generate structured JSON output in backend/documents/extraction/json_extractor.py
- [x] T025 [P] [US1] Generate summaries in backend/documents/extraction/summarizer.py
- [x] T026 [P] [US1] Extract named entities and metadata in backend/documents/extraction/entity_extractor.py
- [x] T027 [P] [US1] Generate action items and key insights in backend/documents/extraction/insight_extractor.py
- [x] T028 [US1] Build document upload page with progress feedback in frontend/src/pages/upload/

**Checkpoint**: At this point, User Story 1 should be fully functional and
testable independently

---

## Phase 4: User Story 2 - Conversational Q&A on Uploaded Content (Priority: P1)

**Goal**: Users ask natural language questions about uploaded documents and
receive contextually accurate answers generated locally with streaming.

**Independent Test**: Upload a document, ask a series of follow-up questions,
and verify answers are contextually accurate and generated with local
inference only.

### Implementation for User Story 2

- [x] T009 [US2] Build chat interface with message bubbles and input in frontend/src/pages/chat/
- [x] T010 [US2] Implement FastAPI REST endpoints for chat in backend/api/chat.py
- [x] T011 [US2] Implement WebSocket streaming for real-time responses in backend/api/streaming.py
- [x] T012 [US2] Integrate Ollama backend with model abstraction layer in backend/ai/ollama_service.py
- [x] T013 [P] [US2] Implement local conversation persistence in SQLite in backend/memory/conversation_store.py
- [x] T014 [P] [US2] Implement model selection UI in frontend/src/pages/settings/
- [x] T023 [US2] Implement Retrieval-Augmented Generation pipeline in backend/ai/rag_pipeline.py

**Checkpoint**: At this point, User Stories 1 AND 2 should both work
independently

---

## Phase 5: User Story 3 - Multi-Format Input and Processing (Priority: P2)

**Goal**: Users upload text-containing images for OCR and audio recordings
for transcription; both become searchable and queryable.

**Independent Test**: Upload a text-containing image and verify OCR output;
upload an audio file and verify transcription output — each without network
activity.

### Implementation for User Story 3

- [x] T018 [US3] Implement OCR pipeline using Tesseract in backend/documents/ocr.py
- [x] T019 [P] [US3] Implement audio transcription using whisper.cpp in backend/documents/transcriber.py
- [x] T029 [US3] Build searchable document library page in frontend/src/pages/documents/

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T030 Settings page in frontend/src/pages/settings/
- [ ] T031 [P] Responsive layout refinement in frontend/src/components/
- [ ] T032 [P] Backend unit tests in tests/unit/
- [ ] T033 [P] Frontend component tests in frontend/tests/
- [ ] T034 [P] Integration tests in tests/integration/
- [ ] T035 Verify complete offline execution with networking disabled
- [ ] T036 [P] Benchmark CPU inference performance and document results in docs/benchmarks.md
- [ ] T047 Validate all CI jobs on the local GitLab Runner
- [ ] T048 Prepare offline demonstration with Wi-Fi disabled
- [ ] T049 [P] Record screenshots and demo assets in docs/demo/
- [ ] T050 Perform final repository review and submission

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all
  user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (needs
  document pipeline for RAG)
- **User Story 3 (Phase 5)**: Depends on User Story 1 completion (needs
  extraction pipeline for OCR/transcription results)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — No dependencies on
  other stories
- **User Story 2 (P1)**: Depends on US1 document pipeline — RAG requires
  indexed documents
- **User Story 3 (P2)**: Depends on US1 extraction pipeline — OCR/transcript
  flow into chunking + embedding
- **Polish**: Depends on all stories being complete

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services
- Services before endpoints/UI
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Models within a story marked [P] can run in parallel
- Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all parser tasks together:
Task: "T015 Implement PDF parser using PyMuPDF in backend/documents/parsers/pdf_parser.py"
Task: "T016 [P] Implement DOCX parser using python-docx in backend/documents/parsers/docx_parser.py"
Task: "T017 [P] Implement TXT and Markdown parser in backend/documents/parsers/text_parser.py"

# Launch all extraction tasks together:
Task: "T025 [P] Generate summaries in backend/documents/extraction/summarizer.py"
Task: "T026 [P] Extract named entities and metadata in backend/documents/extraction/entity_extractor.py"
Task: "T027 [P] Generate action items and key insights in backend/documents/extraction/insight_extractor.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Document Upload + Extraction) → Test independently →
   Deploy/Demo (MVP!)
3. Add User Story 2 (Conversational Q&A) → Test independently → Deploy/Demo
4. Add User Story 3 (Multi-Format Input) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Document pipeline)
   - Developer B: User Story 2 (Chat + RAG) — starts after US1 completions
   - Developer C: User Story 3 (OCR + Audio) — starts after US1 completions
3. Polish phase done together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that
  break independence
