# Project Features Architecture — Technical Specification & Guide

> **Domain**: Feature-Sliced Design (FSD) across Client and Server  
> **Applies to**: Modular Domain Engineering across all Soul Monorepo applications

---

## 1. Feature-Sliced Design (FSD) Philosophy

Instead of organizing code by technical file type (putting all components together, all hooks together, all routers together), the Soul Monorepo organizes code into **vertical domain slices**. Each slice encapsulates all the technical components required to deliver a single business capability.

```
                  FEATURE-SLICED CO-LOCATION
 ┌─────────────────────────────────────────────────────────────┐
 │           client/src/features/chat-assistant/               │
 │                                                             │
 │   ├── api/                                                  │
 │   │   └── chatApi.ts         (Typed fetcher to /api/chat)   │
 │   ├── components/                                           │
 │   │   ├── ChatWindow.tsx     (Main chat container)          │
 │   │   ├── MessageList.tsx    (Virtual list of messages)     │
 │   │   └── ChatInput.tsx      (Prompt text input & send)     │
 │   ├── hooks/                                                │
 │   │   └── useChatSession.ts  (React 19 state & streaming)   │
 │   ├── types.ts               (Message, Session interfaces)  │
 │   ├── index.ts               (PUBLIC FACADE ENTRY POINT)    │
 │   └── README.md              (Feature documentation)        │
 └─────────────────────────────────────────────────────────────┘
                               │
               Only public exports exposed to App
                               ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                      client/src/app/                        │
 │  import { ChatWindow } from '@/features/chat-assistant';    │
 └─────────────────────────────────────────────────────────────┘
```

---

## 2. Anatomy of a Client Feature Slice

### A. The Public Barrier (`index.ts`)

```typescript
// client/src/features/chat-assistant/index.ts
// ONLY export what the application shell needs to render!
export { ChatWindow } from './components/ChatWindow';
export { useChatSession } from './hooks/useChatSession';
export type { ChatMessage, ChatSession } from './types';
```

### B. Typed API Caller (`api/chatApi.ts`)

```typescript
// client/src/features/chat-assistant/api/chatApi.ts
import type { ChatMessage, SendMessagePayload } from '../types';

export async function sendMessage(payload: SendMessagePayload): Promise<ChatMessage> {
  const response = await fetch('/api/v1/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.statusText}`);
  }

  const envelope = await response.json();
  return envelope.data;
}
```

### C. Custom Hook with React 19 Primitives (`hooks/useChatSession.ts`)

```typescript
// client/src/features/chat-assistant/hooks/useChatSession.ts
import { useState, useTransition } from 'react';
import { sendMessage } from '../api/chatApi';
import type { ChatMessage } from '../types';

export function useChatSession(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSend = (text: string) => {
    startTransition(async () => {
      const newMessage = await sendMessage({ sessionId, content: text });
      setMessages((prev) => [...prev, newMessage]);
    });
  };

  return { messages, isPending, handleSend };
}
```

---

## 3. Server Feature Slice Architecture

On the FastAPI backend, the structure mirrors the frontend domain slice:

```text
server/features/chat/
├── router.py                   # APIRouter declaring endpoints & HTTP codes
├── service.py                  # AI generation, database queries & business logic
├── schemas.py                  # Pydantic v2 request & response schemas
└── __init__.py                 # Public package interface
```

### Server Implementation Example

#### `server/features/chat/schemas.py`
```python
from pydantic import BaseModel, Field

class SendMessageRequest(BaseModel):
    session_id: str
    content: str = Field(..., min_length=1, max_length=4000)

class MessageResponse(BaseModel):
    id: str
    session_id: str
    sender: str
    content: str
    created_at: str
```

#### `server/features/chat/service.py`
```python
import uuid
from datetime import datetime, timezone
import sqlite3
from .schemas import SendMessageRequest, MessageResponse

class ChatService:
    def __init__(self, db: sqlite3.Connection):
        self.db = db

    async def post_message(self, req: SendMessageRequest) -> MessageResponse:
        msg_id = f"msg_{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc).isoformat()
        
        with self.db:
            self.db.execute(
                "INSERT INTO messages (id, session_id, sender, content, created_at) VALUES (?, ?, ?, ?, ?)",
                (msg_id, req.session_id, "user", req.content, now)
            )
        
        return MessageResponse(
            id=msg_id,
            session_id=req.session_id,
            sender="user",
            content=req.content,
            created_at=now
        )
```

#### `server/features/chat/router.py`
```python
from fastapi import APIRouter, Depends, status
import sqlite3
from database.connection import get_db
from .schemas import SendMessageRequest, MessageResponse
from .service import ChatService

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/messages", response_model=dict, status_code=status.HTTP_201_CREATED)
async def send_message(payload: SendMessageRequest, db: sqlite3.Connection = Depends(get_db)):
    service = ChatService(db)
    result = await service.post_message(payload)
    return {"success": True, "data": result.model_dump(), "error": None}
```

---

## 4. Feature Directory Standards Summary

| Slice Layer | Primary Objective | Permitted Dependencies | Forbidden Patterns |
|---|---|---|---|
| `components/` | Visual rendering & UI interactions | Hooks, types, `@/shared/components/ui` | Direct SQL or raw unparsed fetch calls |
| `api/` | Network requests to backend | Types, shared HTTP client | React hooks or JSX components |
| `hooks/` | State management & side effects | React primitives, `api/`, types | Rendering UI markup |
| `types.ts` | Type safety contracts | Zod, TypeScript standard types | Runtime code or side-effects |
| `index.ts` | Public export boundary | Internal feature files | Re-exporting private components |
