import logging
import os

import numpy as np
from ai.ollama_client import llm_client

# Delay import of pypdf/docx until runtime to ensure pip finishes installing them first
logger = logging.getLogger(__name__)


class LocalRAG:
    def __init__(self):
        self.chunks = []  # list of dicts: {"filename": str, "text": str}
        self.embeddings = []  # list of numpy arrays (embedding vectors)
        self.filenames = []  # list of loaded files

    def extract_text(self, file_path: str, filename: str) -> str:
        ext = os.path.splitext(filename)[1].lower()
        text = ""

        try:
            if ext == ".txt" or ext == ".md":
                with open(file_path, encoding="utf-8", errors="ignore") as f:
                    text = f.read()
            elif ext == ".pdf":
                from pypdf import PdfReader

                pdf_reader = PdfReader(file_path)
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            elif ext in [".docx", ".doc"]:
                import docx

                doc = docx.Document(file_path)
                text = "\n".join([para.text for para in doc.paragraphs])
            elif ext == ".csv":
                import csv

                with open(file_path, encoding="utf-8", errors="ignore") as f:
                    csv_reader = csv.reader(f)
                    text = "\n".join([", ".join(row) for row in csv_reader])
            else:
                # Fallback to plain text reading
                with open(file_path, encoding="utf-8", errors="ignore") as f:
                    text = f.read()
        except Exception as e:
            logger.error(f"Failed to extract text from {filename}: {e}")

        return text

    def chunk_text(self, text: str, chunk_size=500, overlap=100) -> list:
        """Splits text into chunks of roughly chunk_size characters with overlap."""
        chunks = []
        words = text.split()

        current_chunk = []
        current_length = 0

        for word in words:
            current_chunk.append(word)
            current_length += len(word) + 1

            if current_length >= chunk_size:
                chunks.append(" ".join(current_chunk))
                # Retain overlap words
                overlap_words = current_chunk[-max(1, overlap // 5) :]
                current_chunk = overlap_words
                current_length = sum(len(w) + 1 for w in current_chunk)

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return [c.strip() for c in chunks if c.strip()]

    def add_document(self, file_path: str, filename: str, embed_model="nomic-embed-text") -> bool:
        try:
            text = self.extract_text(file_path, filename)
            if not text.strip():
                logger.warning(f"No text extracted from document: {filename}")
                return False

            chunks = self.chunk_text(text)
            logger.info(f"Chunked document '{filename}' into {len(chunks)} fragments")

            success_count = 0
            for chunk in chunks:
                try:
                    # Generate local vector using Ollama's embedding API
                    response = llm_client.client.embeddings(model=embed_model, prompt=chunk)
                    embedding = response.get("embedding")
                    if embedding:
                        self.chunks.append({"filename": filename, "text": chunk})
                        self.embeddings.append(np.array(embedding))
                        success_count += 1
                except Exception:
                    # If embedding model fails (not pulled), we store the text chunk anyway
                    # and will fallback to token-matching query retrieval.
                    self.chunks.append({"filename": filename, "text": chunk})
                    success_count += 1

            if success_count > 0:
                if filename not in self.filenames:
                    self.filenames.append(filename)
                return True
            return False
        except Exception as e:
            logger.error(f"Error adding document {filename} to RAG: {e}")
            return False

    def query(self, query_text: str, k=3, embed_model="nomic-embed-text") -> list:
        if not self.chunks:
            return []

        # Fallback keyword overlap search if no embeddings were generated
        if not self.embeddings:
            return self._fallback_keyword_search(query_text, k)

        try:
            # Embed the query
            response = llm_client.client.embeddings(model=embed_model, prompt=query_text)
            query_vector = np.array(response.get("embedding"))

            similarities = []
            for emb in self.embeddings:
                # Cosine similarity calculation
                dot_product = np.dot(query_vector, emb)
                norm_q = np.linalg.norm(query_vector)
                norm_e = np.linalg.norm(emb)
                similarity = dot_product / (norm_q * norm_e) if norm_q and norm_e else 0.0
                similarities.append(similarity)

            top_k_indices = np.argsort(similarities)[::-1][:k]

            results = []
            for idx in top_k_indices:
                results.append(
                    {
                        "filename": self.chunks[idx]["filename"],
                        "text": self.chunks[idx]["text"],
                        "score": float(similarities[idx]),
                        "method": "semantic",
                    }
                )
            return results
        except Exception as e:
            logger.warning(f"Semantic search failed, falling back to keyword search: {e}")
            return self._fallback_keyword_search(query_text, k)

    def _fallback_keyword_search(self, query: str, k=3) -> list:
        """Fallback word-overlap similarity search when offline embeddings are unavailable."""
        query_words = set(query.lower().split())
        scores = []

        for chunk in self.chunks:
            chunk_words = set(chunk["text"].lower().split())
            intersection = query_words.intersection(chunk_words)
            union = query_words.union(chunk_words)
            score = len(intersection) / len(union) if union else 0.0
            scores.append(score)

        top_k_indices = np.argsort(scores)[::-1][:k]
        results = []
        for idx in top_k_indices:
            if scores[idx] > 0:
                results.append(
                    {
                        "filename": self.chunks[idx]["filename"],
                        "text": self.chunks[idx]["text"],
                        "score": float(scores[idx]),
                        "method": "keyword",
                    }
                )
        return results

    def clear(self):
        """Clears all indexed documents from session memory."""
        self.chunks = []
        self.embeddings = []
        self.filenames = []


rag_engine = LocalRAG()
