# Models API Contract

## GET /models

List available locally installed models.

**Response** (JSON):
```json
{
  "models": [
    {
      "id": "string",
      "name": "string",
      "size": "string",
      "active": "bool"
    }
  ]
}
```

## POST /models/select

Select and activate a model.

**Request** (JSON):
```json
{
  "model_id": "string"
}
```

**Response**: `200 OK`
```json
{
  "status": "active",
  "model_id": "string"
}
```
