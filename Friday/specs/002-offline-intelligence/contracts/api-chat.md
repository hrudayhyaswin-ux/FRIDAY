# Chat API Contract

## POST /chat

Send a message and receive a streaming response.

**Request** (JSON):
```json
{
  "conversation_id": "uuid | null",
  "message": "string",
  "model_id": "string | null"
}
```

- `conversation_id`: `null` creates a new conversation.
- `model_id`: `null` uses the currently selected model.

**Response**: WebSocket upgrade or SSE stream. Each chunk:

```
data: {"token": "string", "done": false}
data: {"token": "", "done": true, "conversation_id": "uuid"}
```

## GET /conversations

List all conversations.

**Response** (JSON):
```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "string",
      "message_count": "int",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ]
}
```

## GET /conversations/{id}

Get a full conversation with all messages.

**Response** (JSON):
```json
{
  "id": "uuid",
  "title": "string",
  "model_id": "string",
  "messages": [
    {"id": "uuid", "role": "user|assistant", "content": "string", "created_at": "datetime"}
  ],
  "created_at": "datetime"
}
```

## DELETE /conversations/{id}

Delete a conversation and all its messages.

**Response**: `204 No Content`

## POST /conversations/{id}/messages/{message_id}/regenerate

Regenerate the assistant's last response.

**Response**: Same streaming format as POST /chat.
