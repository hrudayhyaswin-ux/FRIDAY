import logging
import json
import re
from typing import List, Dict, Any
from ai.ollama_client import llm_client
from core.config import settings

logger = logging.getLogger(__name__)

def extract_entities(text: str, max_chars: int = 4000) -> List[Dict[str, Any]]:
    """Extracts key named entities (Person, Org, Location, Date) from text using LLM or regex fallback."""
    if not text or not text.strip():
        return []

    truncated_text = text[:max_chars]
    
    prompt = (
        "Extract key named entities from the following text. Categorize them into 'Person', 'Organization', 'Location', or 'Date'. "
        "Return ONLY a JSON list of objects, where each object has 'name' and 'type' keys. Do not include any markdown styling or extra text. "
        "Example output: [{\"name\": \"Alice\", \"type\": \"Person\"}, {\"name\": \"Google\", \"type\": \"Organization\"}]\n\n"
        f"Text: {truncated_text}"
    )
    
    messages = [
        {"role": "system", "content": "You are a JSON-only entity extraction service. Output valid JSON list only, no explanation."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        if llm_client.check_connection():
            logger.info("Extracting entities using Ollama...")
            response = llm_client.chat_generate(model=settings.DEFAULT_MODEL, messages=messages)
            if response:
                # Clean up response to find JSON block
                clean_response = response.strip()
                # Remove markdown code block markers if any
                clean_response = re.sub(r"^```(json)?", "", clean_response)
                clean_response = re.sub(r"```$", "", clean_response).strip()
                
                entities = json.loads(clean_response)
                if isinstance(entities, list):
                    return entities
    except Exception as e:
        logger.error(f"Ollama entity extraction failed: {e}")
        
    # Heuristic fallback
    logger.info("Using regex-based heuristic entity extraction fallback.")
    entities = []
    
    # 1. Simple date regexes
    dates = re.findall(r'\b\d{4}-\d{2}-\d{2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b', text)
    for date in set(dates[:10]):
        entities.append({"name": date, "type": "Date"})
        
    # 2. Extract capitalized words (candidate names/orgs)
    words = re.findall(r'\b[A-Z][a-zA-Z]{2,}\s[A-Z][a-zA-Z]{2,}\b|\b[A-Z][a-zA-Z]{2,}\b', text)
    # Filter common english words that might be capitalized at start of sentence
    stop_words = {"The", "This", "They", "When", "Then", "Given", "And", "But", "For", "With", "Here", "There", "Under"}
    for word in set(words[:20]):
        if word not in stop_words:
            # Simple heuristic: multi-word capitalized are usually names/locations
            ent_type = "Person" if " " in word else "Organization"
            entities.append({"name": word, "type": ent_type})
            
    return entities
