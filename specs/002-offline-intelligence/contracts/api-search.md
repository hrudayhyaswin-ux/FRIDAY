# Search API Contract

## POST /search

Semantic search across all uploaded documents.

**Request** (JSON):
```json
{
  "query": "string",
  "top_k": "int | null"
}
```

- `top_k`: Number of results (default: 5, max: 20).

**Response** (JSON):
```json
{
  "results": [
    {
      "document_id": "uuid",
      "document_name": "string",
      "chunk_index": "int",
      "content": "string",
      "score": "float"
    }
  ],
  "query": "string"
}
```
