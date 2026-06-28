# Documents API Contract

## POST /documents/upload

Upload a file for processing.

**Request**: `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | The document file (PDF, TXT, MD, image, audio) |

**Response** (JSON): `201 Created`
```json
{
  "id": "uuid",
  "filename": "string",
  "file_type": "string",
  "file_size": "int",
  "status": "uploaded",
  "created_at": "datetime"
}
```

## GET /documents

List all uploaded documents.

**Response** (JSON):
```json
{
  "documents": [
    {
      "id": "uuid",
      "filename": "string",
      "file_type": "string",
      "file_size": "int",
      "status": "uploaded|processing|ready|failed",
      "has_structured_data": "bool",
      "created_at": "datetime"
    }
  ]
}
```

## GET /documents/{id}

Get document details including extracted knowledge.

**Response** (JSON):
```json
{
  "id": "uuid",
  "filename": "string",
  "file_type": "string",
  "file_size": "int",
  "status": "string",
  "metadata": {},
  "extracted_knowledge": {
    "summary": "string | null",
    "entities": [],
    "key_facts": [],
    "action_items": [],
    "structured_data": {}
  },
  "created_at": "datetime"
}
```

## DELETE /documents/{id}

Delete a document and all associated data (chunks, embeddings, extracted
knowledge).

**Response**: `204 No Content`
