# Deliverable E: Final Bug Triage & Fix Progress

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)  
**Date:** April 17, 2026  

---

## 1. Remaining Issues & Technical Debt

| Item | Rank | Description | Component | Owner | Expected Disposition |
|------|------|-------------|-----------|-------|----------------------|
| Firefox Audio Compatibility | Critical | Audio capture fails on Gecko-based browsers; prevents non-Chrome testing. | AudioWorklet / Frontend | Ivan | Fixed (Week 15) |
| Auth Hardening: Token Revocation | Critical | Logout clears cookies but doesn't invalidate JWT on the server-side. | Auth API / Middleware | Ivan | Fixed (Week 15) |
| WebSocket Auto-Reconnect | Important | No heartbeat/recovery for AssemblyAI stream drops. | Transcription Engine | Ivan | Fixed (Week 15) |
| Dashboard Component Bloat | Important | The /call page is a monolith; needs decomposition for maintainability. | Dashboard UI | Jaxon | Polished (Week 16) |
| Dashboard State Sanitization | Important | Checklist/Transcript stale data persists between sessions. | React State Manager | Jaxon | Fixed (Week 15) |
| Polling Resilience | Important | UI hangs or fails silently when state fetch requests time out. | State API / Frontend | Ivan | Fixed (Week 16) |
| Audit Trail Pagination | Optional | "Fetch all" approach for history will lead to lag as DB grows. | Sessions API / History UI | Ivan | Deferred (Post-v1.0) |
| Advanced Transcript Search | Optional | No full-text search within archived transcripts. | PostgreSQL / History UI | Ivan | Deferred (Post-v1.0) |

---

## 2. Decision Rationale (Time Pressure)

**Critical Fixes:**  
The Firefox block is the primary barrier to external evaluation. Token Revocation must be addressed to satisfy security hardening requirements before the final presentation.

**Maintenance Fixes:**  
We are prioritizing component refactoring and state sanitization to ensure the project is actually maintainable by a third party, as required by the hand-off rubric.

**Deferred Items:**  
Pagination and full-text search are ranked as optional. While valuable, they do not threaten the "core workflow" and will be pushed to the post-release roadmap if time expires.

---

## 3. Issues Closed This Week

| Issue # | Description | Resolution | PR Link |
|----------|-------------|------------|---------|
| #57 | Validation Inconsistency | Extracted `parseRequestBody()` utility and unified Zod schemas. | PR #57 |
| #59 | Observability Blind Spots | Added health checks, startup env validation, and duration logging. | PR #59 |
| #60 | Missing Regression Tests | Added 10 tests for login validation, frequency edge cases, and session IDOR. | PR #60 |