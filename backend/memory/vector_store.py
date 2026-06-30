import json
import logging
import os
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


class LocalVectorStore:
    def __init__(self, storage_dir: str = "knowledge"):
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)

        self.index_path = os.path.join(self.storage_dir, "vectors.index")
        self.map_path = os.path.join(self.storage_dir, "vectors.map")

        self.use_faiss = False
        self.faiss_index: Any = None
        self.fallback_vectors: list[np.ndarray] = []
        self.mappings: list[dict[str, str]] = []

        self._init_store()

    def _init_store(self):
        # Try loading FAISS
        try:
            import faiss  # noqa: F401

            self.use_faiss = True
            logger.info("FAISS library detected. Using FAISS for vector search.")
        except ImportError:
            logger.warning("FAISS library not installed. Falling back to NumPy-based vector store.")

        self.load()

    def add_embeddings(self, chunk_ids: list[str], doc_ids: list[str], embeddings: list[list[float]]):
        """Adds a list of embeddings and their mappings to the index."""
        if not embeddings:
            return

        np_embeddings = np.array(embeddings).astype("float32")
        # Normalize vectors for cosine similarity (inner product search)
        norms = np.linalg.norm(np_embeddings, axis=1, keepdims=True)
        # Avoid division by zero
        norms[norms == 0] = 1.0
        np_embeddings = np_embeddings / norms

        new_mappings = [{"chunk_id": cid, "document_id": did} for cid, did in zip(chunk_ids, doc_ids, strict=False)]

        if self.use_faiss:
            import faiss

            dim = np_embeddings.shape[1]
            if self.faiss_index is None:
                self.faiss_index = faiss.IndexFlatIP(dim)
            self.faiss_index.add(np_embeddings)
        else:
            for vec in np_embeddings:
                self.fallback_vectors.append(vec)

        self.mappings.extend(new_mappings)
        self.save()

    def search(self, query_embedding: list[float], k: int = 5) -> list[tuple[str, str, float]]:
        """
        Searches the index for top-k similar embeddings.
        Returns a list of tuples: (chunk_id, document_id, similarity_score)
        """
        if not self.mappings:
            return []

        np_query = np.array(query_embedding).astype("float32")
        q_norm = np.linalg.norm(np_query)
        if q_norm > 0:
            np_query = np_query / q_norm

        if self.use_faiss and self.faiss_index is not None:
            # Reshape query for FAISS search (needs 2D array)
            np_query = np_query.reshape(1, -1)
            scores, indices = self.faiss_index.search(np_query, min(k, len(self.mappings)))

            results = []
            for score, idx in zip(scores[0], indices[0], strict=False):
                if idx != -1 and idx < len(self.mappings):
                    mapping = self.mappings[idx]
                    results.append((mapping["chunk_id"], mapping["document_id"], float(score)))
            return results
        else:
            # Fallback NumPy search
            if not self.fallback_vectors:
                return []

            similarities = []
            for vec in self.fallback_vectors:
                similarity = np.dot(np_query, vec)
                similarities.append(similarity)

            top_k_indices = np.argsort(-np.array(similarities), kind="mergesort")[:k]
            results = []
            for idx in top_k_indices:
                mapping = self.mappings[idx]
                results.append((mapping["chunk_id"], mapping["document_id"], float(similarities[idx])))
            return results

    def delete_document_vectors(self, doc_id: str):
        """Removes all embeddings corresponding to a document ID and rebuilds the index."""
        indices_to_keep = [i for i, m in enumerate(self.mappings) if m["document_id"] != doc_id]

        # Extract kept vectors and mappings
        kept_mappings = [self.mappings[i] for i in indices_to_keep]

        if self.use_faiss:
            import faiss

            # FAISS IndexFlat doesn't support easy removal by ID mapping, so we rebuild the index
            if kept_mappings and self.faiss_index is not None:
                # Read all vectors from the index and filter them
                # But IndexFlatIP doesn't allow direct reconstruction easily unless we keep them.
                # So we maintain fallback_vectors even for FAISS to make rebuilding easy,
                # or we just reconstruct from mappings by matching (not possible without raw data).
                # Actually, the easiest is to maintain self.fallback_vectors all the time
                # so we can rebuild FAISS index.
                pass

        # To make deleting robust, we will maintain the fallback_vectors list
        # even when using FAISS, so we can always rebuild the index.
        self.fallback_vectors = [self.fallback_vectors[i] for i in indices_to_keep]
        self.mappings = kept_mappings

        if self.use_faiss:
            import faiss

            if self.fallback_vectors:
                dim = self.fallback_vectors[0].shape[0]
                self.faiss_index = faiss.IndexFlatIP(dim)
                self.faiss_index.add(np.array(self.fallback_vectors).astype("float32"))
            else:
                self.faiss_index = None

        self.save()

    def save(self):
        """Save vector index and mappings to disk."""
        # Save mappings
        with open(self.map_path, "w") as f:
            json.dump(self.mappings, f)

        # Save vectors
        if self.use_faiss and self.faiss_index is not None:
            import faiss

            faiss.write_index(self.faiss_index, self.index_path)
        else:
            # Save fallback vectors using numpy format
            if self.fallback_vectors:
                np.save(self.index_path + ".npy", np.array(self.fallback_vectors))
            elif os.path.exists(self.index_path + ".npy"):
                os.remove(self.index_path + ".npy")

    def load(self):
        """Load vector index and mappings from disk."""
        if os.path.exists(self.map_path):
            try:
                with open(self.map_path) as f:
                    self.mappings = json.load(f)
            except Exception as e:
                logger.error(f"Error loading mappings: {e}")
                self.mappings = []

        if self.use_faiss:
            import faiss

            if os.path.exists(self.index_path):
                try:
                    self.faiss_index = faiss.read_index(self.index_path)
                    # Reconstruct fallback vectors from mappings or keep empty
                    # For delete operations, we will populate fallback_vectors
                    # by reading from the index if possible.
                    # Or we just keep fallback_vectors in sync.
                    if self.faiss_index is not None and self.mappings:
                        # IndexFlatIP allows reading reconstructed vectors
                        ntotal = self.faiss_index.ntotal
                        self.fallback_vectors = [self.faiss_index.reconstruct(i) for i in range(ntotal)]
                    return
                except Exception as e:
                    logger.error(f"Error loading FAISS index: {e}")
                    self.faiss_index = None

        # Fallback NumPy load
        npy_path = self.index_path + ".npy"
        if os.path.exists(npy_path):
            try:
                np_vecs = np.load(npy_path)
                self.fallback_vectors = list(np_vecs)
            except Exception as e:
                logger.error(f"Error loading NumPy vectors: {e}")
                self.fallback_vectors = []

    def clear(self):
        """Clears all vectors and mappings."""
        self.mappings = []
        self.fallback_vectors = []
        self.faiss_index = None
        if os.path.exists(self.index_path):
            os.remove(self.index_path)
        if os.path.exists(self.index_path + ".npy"):
            os.remove(self.index_path + ".npy")
        if os.path.exists(self.map_path):
            os.remove(self.map_path)


vector_store = LocalVectorStore()
