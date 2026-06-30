import logging

from ai.ollama_client import llm_client

logger = logging.getLogger(__name__)

# Lazy load sentence_transformers
_model = None


def _get_sentence_transformer_model():
    global _model
    if _model is not None:
        return _model
    try:
        from sentence_transformers import SentenceTransformer

        logger.info("Loading sentence-transformers model 'all-MiniLM-L6-v2'...")
        _model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
        logger.info("SentenceTransformer loaded successfully.")
        return _model
    except ImportError:
        logger.warning("sentence-transformers not installed. Will use Ollama for embeddings.")
        return None
    except Exception as e:
        logger.error(f"Error loading sentence-transformers: {e}")
        return None


def get_embedding(text: str, embed_model: str = "nomic-embed-text") -> list[float]:
    """Generates an embedding vector for the text using local SentenceTransformer or local Ollama."""
    # Try sentence-transformers first
    model = _get_sentence_transformer_model()
    if model is not None:
        try:
            vector = model.encode(text).tolist()
            return vector
        except Exception as e:
            logger.error(f"SentenceTransformer embedding generation failed: {e}. Falling back to Ollama.")

    # Fallback to Ollama embedding API
    try:
        if llm_client.check_connection():
            logger.info(f"Generating embedding via Ollama model '{embed_model}'")
            response = llm_client.client.embeddings(model=embed_model, prompt=text)
            embedding = response.get("embedding")
            if embedding:
                return embedding
    except Exception as e:
        logger.error(f"Ollama embedding generation failed: {e}")

    logger.warning("Could not generate embedding vector. Returning zero vector.")
    # Return a zero vector of dimension 384 (standard MiniLM dimension)
    return [0.0] * 384
