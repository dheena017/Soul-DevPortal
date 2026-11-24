# Networking, Ports & Project Specifications

This section defines port ranges, network routing conventions, socket management, and individual micro-application network topology.

---

## Documents in this Section
1. [The 5 Golden Rules of Networking & Ports](golden-rules.md) — Port blocks, reverse proxy rules, and host binding safety.
2. [Port Allocation Matrix](port-allocation-matrix.md) — Master port allocations for Frontend (`5173–5181`) and Backend (`8000–8008`) across all 9 monorepo applications.
3. [Socket Cleanup Protocol](socket-cleanup-protocol.md) — Rules for terminating zombie processes and clearing reserved sockets.
