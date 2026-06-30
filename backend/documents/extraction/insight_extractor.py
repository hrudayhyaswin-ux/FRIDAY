import json
import logging
import re
from typing import Any

from ai.ollama_client import llm_client
from core.config import settings

logger = logging.getLogger(__name__)


def extract_insights(text: str, max_chars: int = 4000) -> dict[str, Any]:
    """Extracts key facts and action items from text using local LLM or heuristics."""
    if not text or not text.strip():
        return {"key_facts": [], "action_items": []}

    truncated_text = text[:max_chars]

    prompt = (
        "Extract key facts/claims and actionable task/action items from the following text.\n"
        "Return ONLY a JSON object with two keys: 'key_facts' (list of strings) and 'action_items' (list of strings).\n"
        "Do not include any markdown styling or extra text.\n"
        'Example output: {"key_facts": ["Fact 1", "Fact 2"], "action_items": ["Task 1", "Task 2"]}\n\n'
        f"Text: {truncated_text}"
    )

    messages = [
        {
            "role": "system",
            "content": "You are a JSON-only insight extraction service. Output valid JSON object only, no explanation.",
        },
        {"role": "user", "content": prompt},
    ]

    try:
        if llm_client.check_connection():
            logger.info("Extracting insights using Ollama...")
            response = llm_client.chat_generate(model=settings.DEFAULT_MODEL, messages=messages)
            if response:
                clean_response = response.strip()
                clean_response = re.sub(r"^```(json)?", "", clean_response)
                clean_response = re.sub(r"```$", "", clean_response).strip()

                insights = json.loads(clean_response)
                if isinstance(insights, dict) and "key_facts" in insights and "action_items" in insights:
                    return insights
    except Exception as e:
        logger.error(f"Ollama insight extraction failed: {e}")

    # Heuristic fallback
    logger.info("Using heuristic insight extraction fallback.")
    key_facts = []
    action_items = []

    lines = [line.strip() for line in text.split("\n") if line.strip()]

    # 1. Search for action item indicators
    action_indicators = [
        "todo",
        "action item",
        "must",
        "should",
        "need to",
        "task",
        "assign",
        "deadline",
    ]
    for line in lines:
        line_lower = line.lower()
        if any(ind in line_lower for ind in action_indicators) or line.startswith("- [ ]") or line.startswith("* [ ]"):
            # Clean up checklist formats
            clean_line = re.sub(r"^[-*]\s*\[\s*\]\s*", "", line)
            clean_line = re.sub(r"^[-*]\s*", "", clean_line)
            action_items.append(clean_line)
            if len(action_items) >= 10:
                break

    # 2. Extract bullet points or first sentences as key facts
    for line in lines:
        if line.startswith("- ") or line.startswith("* ") or line.startswith("• "):
            clean_line = re.sub(r"^[-*•]\s*", "", line)
            # Make sure it's not already in action items
            if clean_line not in action_items:
                key_facts.append(clean_line)
            if len(key_facts) >= 10:
                break

    # If key facts are still empty, take some sentences from the text
    if not key_facts:
        sentences = [s.strip() for s in text.split(".") if s.strip()]
        for s in sentences[:5]:
            key_facts.append(s + ".")

    return {"key_facts": key_facts[:10], "action_items": action_items[:10]}
