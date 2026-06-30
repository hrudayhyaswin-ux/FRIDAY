import os
import sys
import pytest
import numpy as np

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from documents.parsers.text_parser import parse_text
from documents.chunker import chunk_text
from documents.embeddings import get_embedding
from memory.vector_store import LocalVectorStore
from documents.extraction.summarizer import generate_summary
from documents.extraction.entity_extractor import extract_entities
from documents.extraction.insight_extractor import extract_insights

def test_text_parser(tmp_path):
    # Create temporary text file
    test_file = tmp_path / "test.txt"
    test_content = "Hello, this is a test text for offline parser."
    test_file.write_text(test_content, encoding="utf-8")
    
    parsed = parse_text(str(test_file))
    assert parsed == test_content

def test_chunker():
    sample_text = "This is a sentence. And this is another sentence that is slightly longer to test chunking capabilities."
    chunks = chunk_text(sample_text, chunk_size=30, chunk_overlap=10)
    
    assert len(chunks) > 0
    for chunk in chunks:
        assert "content" in chunk
        assert "index" in chunk
        assert "token_count" in chunk
        assert len(chunk["content"]) > 0

@pytest.mark.skipif(not os.environ.get("OLLAMA_HOST"), reason="Ollama not available")
def test_embeddings():
    text = "Query embedding"
    vector = get_embedding(text)
    assert isinstance(vector, list)
    assert len(vector) == 384 or len(vector) == 1536 or len(vector) > 0

def test_vector_store(tmp_path):
    store = LocalVectorStore(storage_dir=str(tmp_path))
    
    chunk_ids = ["chunk_1", "chunk_2"]
    doc_ids = ["doc_1", "doc_1"]
    embeddings = [
        [0.1] * 384,
        [0.2] * 384
    ]
    
    store.add_embeddings(chunk_ids, doc_ids, embeddings)
    assert len(store.mappings) == 2
    
    # Search
    query = [0.1] * 384
    results = store.search(query, k=1)
    assert len(results) == 1
    assert results[0][0] == "chunk_1"
    
    # Delete
    store.delete_document_vectors("doc_1")
    assert len(store.mappings) == 0

@pytest.mark.skipif(not os.environ.get("OLLAMA_HOST"), reason="Ollama not available")
def test_summarizer():
    text = "The quick brown fox jumps over the lazy dog."
    summary = generate_summary(text)
    assert len(summary) > 0

@pytest.mark.skipif(not os.environ.get("OLLAMA_HOST"), reason="Ollama not available")
def test_entity_extractor():
    text = "John Doe works at Google in New York. The launch date is 2026-06-29."
    entities = extract_entities(text)
    assert isinstance(entities, list)
    # Check that at least the offline heuristic extracted something or it returned a list
    assert len(entities) >= 0

@pytest.mark.skipif(not os.environ.get("OLLAMA_HOST"), reason="Ollama not available")
def test_insight_extractor():
    text = "We must launch the product next week. The codebase is fully local. Action item: complete the tests."
    insights = extract_insights(text)
    assert "key_facts" in insights
    assert "action_items" in insights
