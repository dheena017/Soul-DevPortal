# Project Schema Architecture — Technical Specification & Guide

> **Domain**: Canonical Metadata Schemas, Pydantic v2 & Zod Data Contracts  
> **Applies to**: Frontend Client & Backend Server Contracts across the Monorepo

---

## 1. Canonical `metadata.json` Schema Specification

Every project maintains a root `metadata.json` that powers the DevPortal runner, catalog cards, health monitors, and automated port verifiers.

### Complete JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SoulProjectMetadata",
  "type": "object",
  "required": [
    "name",
    "description",
    "features",
    "techStack",
    "commands",
    "localServices",
    "apiEndpoints",
    "configuration"
  ],
  "properties": {
    "name": {
      "type": "string",
      "description": "Human-readable display name of the microservice"
    },
    "description": {
      "type": "string",
      "description": "Concise summary of the micro-application purpose"
    },
    "features": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Key business capabilities offered by the project"
    },
    "techStack": {
      "type": "object",
      "required": ["frontend", "backend", "database"],
      "properties": {
        "frontend": { "type": "array", "items": { "type": "string" } },
        "backend": { "type": "array", "items": { "type": "string" } },
        "database": { "type": "array", "items": { "type": "string" } },
        "ai": { "type": "array", "items": { "type": "string" } }
      }
    },
    "commands": {
      "type": "object",
      "required": ["development", "frontend", "backend", "build"],
      "properties": {
        "development": { "type": "string" },
        "frontend": { "type": "string" },
        "backend": { "type": "string" },
        "build": { "type": "string" },
        "lint": { "type": "string" }
      }
    },
    "localServices": {
      "type": "object",
      "required": ["frontend", "backend", "apiDocs", "healthCheck"],
      "properties": {
        "frontend": { "type": "string", "format": "uri" },
        "backend": { "type": "string", "format": "uri" },
        "apiDocs": { "type": "string", "format": "uri" },
        "healthCheck": { "type": "string", "format": "uri" }
      }
    },
    "apiEndpoints": {
      "type": "array",
      "items": { "type": "string" }
    },
    "configuration": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

---

## 2. Pydantic v2 Server Implementation Patterns

FastAPI routes leverage Pydantic v2 for data contracts, type coercion, and auto-generated Swagger documentation.

```python
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime, timezone

class BaseEntitySchema(BaseModel):
    """Base schema providing automated timestamping and strict config."""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    model_config = {
        "str_strip_whitespace": True,
        "populate_by_name": True,
        "from_attributes": True
    }

class CreateUserRequest(BaseEntitySchema):
    username: str = Field(..., min_length=3, max_length=32, pattern=r"^[a-zA-Z0-9_-]+$")
    email: EmailStr
    role: str = Field(default="user", pattern=r"^(admin|user|guest)$")

    @field_validator("username")
    @classmethod
    def validate_reserved_names(cls, v: str) -> str:
        if v.lower() in {"admin", "root", "system"}:
            raise ValueError("Username is reserved.")
        return v
```

---

## 3. Zod Client Schema Mirroring

On the React 19 client, Zod mirrors the server models to provide instant client-side feedback.

```typescript
// client/src/features/users/types.ts
import { z } from 'zod';

export const CreateUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username cannot exceed 32 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username contains invalid characters'),
  email: z.string().trim().email('Invalid email address format'),
  role: z.enum(['admin', 'user', 'guest']).default('user'),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
}
```
