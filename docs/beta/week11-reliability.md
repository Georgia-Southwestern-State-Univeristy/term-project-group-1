# Week 11 Deliverable C: Reliability Improvements

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)
**Date:** March 27, 2026

---

## Reliability Risks Identified

### Risk 1: Transcript events silently dropped during streaming

The demo page's `postTranscriptEvent()` function fires HTTP POSTs to the backend but never checks the response status. If the backend returns 409 (session ended mid-stream) or 500 (database error), the event is silently lost. The user sees "Listening..." and believes transcription is being recorded, but events are being discarded.

**Severity:** High — silent data loss in the primary workflow.

### Risk 2: Unhandled database errors in API routes

Prisma calls in `POST /api/sessions`, `POST /api/sessions/[id]/transcript-events`, `GET /api/sessions/[id]/state`, and `GET /api/sessions` have no try-catch. If PostgreSQL is unreachable or a query fails, the exception bubbles as an unstructured 500 with a stack trace in the response body and no structured logging.

**Severity:** Medium — degrades observability and returns confusing errors to clients.

### Risk 3: Silent polling failures on the call page

The call page polls `GET /api/sessions/[id]/state` every 2 seconds. Network or server errors are caught and silently discarded (`catch { /* ignore */ }`). The user sees stale data with no indication that real-time updates have stopped.

**Severity:** Medium — user makes decisions based on stale threat scores and checklists.

---

## Fixes Implemented

### Fix 1: Handle transcript POST failures during streaming (Risk 1)

**File:** `app/demo/page.tsx`

**Before:** `postTranscriptEvent()` called `await fetch(...)` without checking `res.ok`. Failures were invisible.

**After:** The function now checks the response status:

- **409 (session ended):** Shows "Session has ended — transcript is no longer being saved." so the user knows to stop.
- **Other errors:** Shows "Transcript save failed (status). Some audio may not be recorded." so the user is aware of data loss.

### Fix 2: Structured database error handling in API routes (Risk 2)

**Files:** `app/api/sessions/route.ts`, `app/api/sessions/[sessionId]/transcript-events/route.ts`, `app/api/sessions/[sessionId]/state/route.ts`

**Before:** Database calls (Prisma operations) were unguarded. A DB failure produced an opaque Next.js 500 with a stack trace.

**After:** All database-touching code blocks are wrapped in try-catch. On failure:

- Logs `logger.error("db.error", { route, message })` with structured context
- Returns `{ error: "Internal server error" }` with status 500
- No stack trace or internal details exposed to the client

---

## Error Handling Improvements

### UX Improvement 1: Call page polling failure indicator (Risk 3)

**File:** `app/call/page.tsx`

**What changed:** Added a `pollFailures` counter that increments on each failed poll and resets on success.

**What the user now sees:**

- After 2 consecutive failures (4 seconds): Yellow banner — "Connection lost — retrying..."
- After 5 consecutive failures (10 seconds): Red banner — "Unable to connect. Please check your connection."
- Banner disappears immediately when polling succeeds again.

The banner uses `role="alert"` for screen reader accessibility.

### UX Improvement 2: Actionable WebSocket error messages on demo page

**File:** `app/demo/page.tsx`

**Before:**

- `ws.onerror`: "WebSocket error — check browser console" (not actionable)
- `ws.onclose`: No message at all

**After:**

- `ws.onerror`: "WebSocket disconnected. Stop streaming and try again, or check your network connection."
- `ws.onclose` (abnormal close): "Streaming connection closed unexpectedly. You may restart streaming."
- Normal closes (code 1000, 1005) do not trigger an error message.
- Added guard: `startStreaming()` checks `session.status === "active"` before proceeding.

---

## Deferred Risks

1. **No WebSocket auto-reconnection** — If the AssemblyAI WebSocket drops, the user must manually stop and restart streaming. Auto-reconnect with exponential backoff would improve resilience but adds complexity to turn tracking and audio buffer management. Deferred to post-beta.

2. **Frequency data fire-and-forget** — POST requests to `/api/sessions/[id]/frequency` silently ignore failures. This is acceptable because frequency data supplements the threat score but is not critical to session integrity.

3. **No rate limiting on API endpoints** — POST endpoints accept unlimited requests. Acceptable for single-tenant prototype; would need rate limiting for production.
