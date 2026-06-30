import logging
import re
from typing import Any

logger = logging.getLogger(__name__)


def chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 100) -> list[dict[str, Any]]:
    """
    Splits text into chunks based on character length with a specified overlap.
    Returns a list of dicts with chunk index, content, and approximate token count.
    """
    if not text or not text.strip():
        return []

    chunks = []
    # Standardize whitespace
    text = re.sub(r"\s+", " ", text).strip()
    words = text.split(" ")

    current_chunk_words = []
    current_char_count = 0
    chunk_index = 0

    for word in words:
        current_chunk_words.append(word)
        current_char_count += len(word) + 1  # +1 for space

        if current_char_count >= chunk_size:
            chunk_content = " ".join(current_chunk_words).strip()
            if chunk_content:
                # Approximate token count (roughly 4 characters per token or 0.75 words per token)
                approx_tokens = max(1, int(len(chunk_content) / 4))
                chunks.append({"index": chunk_index, "content": chunk_content, "token_count": approx_tokens})
                chunk_index += 1

            # Keep overlap words
            # Find how many words to keep from the end to satisfy the overlap
            overlap_chars = 0
            overlap_words: list[str] = []
            for w in reversed(current_chunk_words):
                if overlap_chars + len(w) + 1 <= chunk_overlap:
                    overlap_words.insert(0, w)
                    overlap_chars += len(w) + 1
                else:
                    break

            current_chunk_words = overlap_words
            current_char_count = sum(len(w) + 1 for w in current_chunk_words)

    # Add any remaining text
    if current_chunk_words:
        chunk_content = " ".join(current_chunk_words).strip()
        if chunk_content:
            approx_tokens = max(1, int(len(chunk_content) / 4))
            chunks.append({"index": chunk_index, "content": chunk_content, "token_count": approx_tokens})

    return chunks
