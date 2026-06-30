import logging

from ai.ollama_client import llm_client
from core.config import settings

logger = logging.getLogger(__name__)


def generate_summary(text: str, max_chars: int = 6000) -> str:
    """Generates a structured summary of the document using local Ollama, with fallback."""
    if not text or not text.strip():
        return "No text available to summarize."

    # Truncate text to avoid overloading the local LLM context
    truncated_text = text[:max_chars]
    if len(text) > max_chars:
        truncated_text += "\n\n[Content truncated for summary generation...]"

    prompt = (
        "Analyze the following document content and generate a concise summary. "
        "Also include a brief Table of Contents or high-level outline if appropriate. "
        "Format your response in Markdown.\n\n"
        f"--- DOCUMENT START ---\n{truncated_text}\n--- DOCUMENT END ---"
    )

    messages = [
        {
            "role": "system",
            "content": "You are a precise document summarizer. Keep summaries objective, structured, and informative.",
        },
        {"role": "user", "content": prompt},
    ]

    try:
        if llm_client.check_connection():
            logger.info("Generating summary using Ollama...")
            summary = llm_client.chat_generate(model=settings.DEFAULT_MODEL, messages=messages)
            if summary and not summary.startswith("Connection Error") and not summary.startswith("Ollama Error"):
                return summary.strip()
    except Exception as e:
        logger.error(f"Ollama summary generation failed: {e}")

    # Heuristic fallback if LLM fails or is offline
    logger.info("Using heuristic fallback for summary.")
    sentences = [s.strip() for s in text.split(".") if s.strip()]
    intro_sentences = sentences[:3]
    fallback_summary = " ".join(intro_sentences) + "."
    return (
        f"**[Offline Heuristic Summary]** {fallback_summary}\n\n"
        "*Note: Local LLM was offline or unavailable during summary generation.*"
    )
