# Networking, Ports & Project Specifications

This section defines port ranges, network routing conventions, socket management, and individual micro-application network topology.

## Documents in this Section
1. [The 5 Golden Rules of Networking & Ports](golden-rules.md) — Port blocks, reverse proxy rules, and host binding safety.
2. [Port Allocation Matrix](port-allocation-matrix.md) — Master port allocations for Frontend (`5173–5181`) and Backend (`8000–8008`).
3. [Socket Cleanup Protocol](socket-cleanup-protocol.md) — Rules for terminating zombie processes and clearing reserved sockets.

## Micro-App Specifications (`projects/`)
- [apexmind-ai](projects/apexmind-ai.md) — Client: :5173 | Server: :8000 | FastAPI + SQLite WAL
- [outpass-system](projects/outpass-system.md) — Client: :5174 | Server: :8001 | FastAPI + SQLAlchemy SQLite
- [free-api-hub](projects/free-api-hub.md) — Client: :5175 | Server: :8002 | FastAPI + JSON Flat Store
- [sonikoma](projects/sonikoma.md) — Client: :5176 | Server: :8006 | FastAPI + SQLite / Supabase
- [spatial-dimensions](projects/spatial-dimensions.md) — Client: :5177 | Server: :8007 | FastAPI + JSONL Inquiries Store
- [college-management-system](projects/college-management-system.md) — Client: :5178 | Server: :8003 | Express.js + SQLite3
- [globalpulse-ai](projects/globalpulse-ai.md) — Client: :5179 | Server: :8004 | FastAPI + SQLite News Cache
- [postcraft-ai](projects/postcraft-ai.md) — Client: :5180 | Server: :8005 | Express.js + SQLite3
