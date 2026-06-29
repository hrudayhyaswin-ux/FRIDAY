import os
import logging

logger = logging.getLogger(__name__)

def parse_text(file_path: str) -> str:
    """Extracts text from plain text or Markdown files."""
    try:
        logger.info(f"Parsing plain text/markdown: {file_path}")
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception as e:
        logger.error(f"Failed to parse text file {file_path}: {e}")
        raise e
