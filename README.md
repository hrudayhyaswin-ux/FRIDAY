# FRIDAY AI

> **A fully offline, CPU-powered AI voice assistant built for privacy, speed, and intelligence.**

FRIDAY AI is an offline-first personal AI assistant inspired by virtual assistants like JARVIS and FRIDAY. Unlike cloud-based AI assistants, FRIDAY is designed to work entirely on your local machine without requiring an internet connection or API keys.

It combines local Large Language Models (LLMs), speech recognition, text-to-speech, memory, and modular plugins into a single intelligent assistant that can converse naturally, remember information, understand documents, and automate your computer.

---

# Vision

Build an AI assistant that:

- 🎙️ Understands natural speech
- 🧠 Remembers conversations
- 💻 Runs completely offline
- ⚡ Works on CPU (No GPU Required)
- 🔒 Keeps all user data private
- 📂 Understands documents
- 🖥️ Controls your computer
- 🔌 Supports plugins
- 🌐 Can optionally support cloud AI in future versions

---

# Core Principles

- Offline First
- Privacy by Design
- CPU Friendly
- Modular Architecture
- Open Source
- Extensible
- Cross Platform

---

# Features

## AI Conversation

- Local LLM powered conversations
- Multi-turn conversations
- Context aware responses
- Markdown support
- Code generation
- Reasoning capabilities

---

## Voice Assistant

- Wake word support (Future)
- Speech-to-Text
- Natural Text-to-Speech
- Continuous listening mode
- Voice interruption handling
- Real-time conversation

---

## Memory

FRIDAY remembers important information such as:

- User preferences
- Previous conversations
- Projects
- Important notes
- Personal reminders
- Frequently asked topics

Memory is completely stored locally.

---

## Document Intelligence

Upload files including

- PDF
- DOCX
- TXT
- Markdown
- CSV

FRIDAY can

- Summarize
- Explain
- Search
- Answer questions
- Compare documents

Everything happens locally.

---

## Computer Control

FRIDAY can perform local actions like

- Open applications
- Create folders
- Search files
- Launch software
- Take screenshots
- Execute custom commands

Future versions will include workflow automation.

---

## Plugin System

Every major feature is implemented as a plugin.

Example plugins

- Calculator
- File Manager
- Notes
- Calendar
- Terminal
- Camera
- Music
- Automation
- OCR

Developers can create custom plugins without modifying the core system.

---

# Architecture

```
                   USER

                     │
      Voice / Text / Documents

                     │

           Input Processing Layer

          ┌──────────┴──────────┐
          │                     │
     Speech Input          Text Input

                     │

             Intent Detection

                     │

             Local AI Router

     ┌────────┬─────────┬────────┐
     │        │         │        │
   LLM     Memory    Plugins   Commands
     │        │         │        │
     └────────┴─────────┴────────┘

               Response Engine

                     │

             Text To Speech

                     │

                    USER
```

---

# Technology Stack

## Frontend

- Next.js
- React
- Tailwind CSS
- TypeScript

---

## Backend

- Python
- FastAPI

---

## AI

- Ollama
- llama.cpp
- GGUF Models

---

## Speech Recognition

- whisper.cpp

---

## Text To Speech

- Piper

---

## Vector Database

- FAISS

---

## Embeddings

- Sentence Transformers

---

## Database

- SQLite

---

## File Processing

- PyMuPDF
- python-docx

---

## Automation

- PyAutoGUI
- psutil

---

# Folder Structure

```
FRIDAY-AI/

├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── public/
│
├── backend/
│   ├── api/
│   ├── ai/
│   ├── speech/
│   ├── tts/
│   ├── memory/
│   ├── rag/
│   ├── commands/
│   ├── plugins/
│   ├── database/
│   ├── utils/
│   └── core/
│
├── models/
├── documents/
├── knowledge/
├── plugins/
├── config/
├── logs/
├── tests/
├── docker/
└── README.md
```

---

# AI Pipeline

```
User

↓

Voice or Text

↓

Speech Recognition

↓

Intent Detection

↓

AI Router

↓

Choose Module

├── Conversation
├── Memory
├── Document Search
├── Plugin
└── Computer Command

↓

Generate Response

↓

Speech Output
```

---

# Local AI Models

Recommended CPU Models

| Model | RAM Required | Performance |
|---------|-------------|------------|
| TinyLlama | 2 GB | Fast |
| Phi-3 Mini | 4 GB | Excellent |
| Qwen 2.5 3B | 5 GB | Excellent |
| Gemma 3 4B | 6 GB | Very Good |

---

# Development Roadmap

## Phase 1

- Basic chat
- Ollama integration
- Local LLM
- Website UI

---

## Phase 2

- Voice interaction
- Whisper.cpp
- Piper
- Wake word

---

## Phase 3

- Long-term memory
- SQLite
- FAISS
- Semantic search

---

## Phase 4

- Document understanding
- PDF support
- File search
- Local RAG

---

## Phase 5

- Plugin system
- Automation
- Computer control
- Cross-platform packaging

---

## Phase 6

- Vision models
- Camera support
- OCR
- Image understanding

---

## Future Goals

- Offline AI Operating System
- Desktop Application
- Mobile Companion
- Multi-Agent Architecture
- Local Workflow Automation
- Smart Home Integration
- Optional Cloud AI Support
- Self-Hosted Enterprise Edition

---

# Why FRIDAY?

Unlike traditional AI assistants, FRIDAY prioritizes user privacy.

No conversations leave your computer.

No cloud processing is required.

No subscriptions are necessary.

Your data remains entirely under your control.

---

# Contributing

Contributions are welcome.

You can contribute by:

- Reporting bugs
- Improving documentation
- Building plugins
- Optimizing performance
- Creating new features
- Improving accessibility

Please open an issue before submitting major changes.

---

# License

This project will be released under the **MIT License**.

---

# Inspiration

- Iron Man's JARVIS
- Iron Man's FRIDAY
- Open-source AI community
- Privacy-first computing
- Local LLM ecosystem

---

# Our Mission

> **Create a personal AI assistant that belongs to you—not the cloud.**

FRIDAY is built with one goal in mind:

**Powerful AI. Complete privacy. Fully offline.**