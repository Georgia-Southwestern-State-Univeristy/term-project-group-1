# Deliverable A: Week 13 Sprint Goal & Quality Backlog

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)
**Date:** April 7, 2026

---

## 1. Sprint Goal

Enhance system supportability and operational visibility through structured logging, cross-browser audio reliability, and architectural refactoring to minimize technical debt before final hand-off.

---

## 2. Quality-Focused Backlog

| Item                                | Owner | Acceptance Criteria                                                                                                                  |
| ----------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Firefox Audio Compatibility**  | Ivan  | - Implement MediaRecorder or WebAudio fallback.<br>- Verify real-time transcription works on non-Chromium engines.                   |
| **2. WebSocket Auto-Reconnect**     | Ivan  | - Add heartbeat logic to detect silent drops.<br>- Implement exponential backoff for auto-reconnection attempts.                     |
| **3. Refactoring**                  | Ivan  | - Resolve/Refactoring.<br>- No regressions in core session flow.                                                                     |
| **4. Structured Server Logging**    | Ivan  | - Transition all console.log statements to a structured JSON logger.<br>- Include correlationId to track requests across API routes. |
| **5. Health Check & Diagnostics**   | Ivan  | - Create `/api/health` endpoint verifying DB and API key status.<br>- Add diagnostic panel to the Admin dashboard.                   |
| **6. Dashboard State Sanitization** | Jaxon | - Implement `resetState` hook to purge checklists between sessions.<br>- Ensure no transcript data leaks into subsequent call views. |
| **7. Architecture Visual Audit**    | Jaxon | - Update diagrams to reflect current Prisma/Postgres implementation.<br>- Document component responsibilities for the hand-off.      |

---
