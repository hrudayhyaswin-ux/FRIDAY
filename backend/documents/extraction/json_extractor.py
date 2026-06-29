import logging
from typing import Dict, Any
from documents.extraction.summarizer import generate_summary
from documents.extraction.entity_extractor import extract_entities
from documents.extraction.insight_extractor import extract_insights

logger = logging.getLogger(__name__)

def extract_all_knowledge(text: str) -> Dict[str, Any]:
    """
    Orchestrates the extraction of summary, entities, key facts, and action items.
    Returns a unified structured knowledge dictionary.
    """
    logger.info("Extracting all knowledge from text...")
    
    # 1. Generate summary
    summary = generate_summary(text)
    
    # 2. Extract entities
    entities = extract_entities(text)
    
    # 3. Extract insights (key facts and action items)
    insights = extract_insights(text)
    
    # 4. Generate structured tables/data if any (as dict)
    structured_data = {}
    
    # We can try to build a table of contents or other metrics as structured data
    lines = text.split("\n")
    structured_data["line_count"] = len(lines)
    structured_data["word_count"] = len(text.split())
    structured_data["char_count"] = len(text)
    
    return {
        "summary": summary,
        "entities": entities,
        "key_facts": insights.get("key_facts", []),
        "action_items": insights.get("action_items", []),
        "structured_data": structured_data
    }
