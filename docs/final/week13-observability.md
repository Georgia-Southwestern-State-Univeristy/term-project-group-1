# Week 13 — Observability + Support Visibility

## Overview

Three support-oriented improvements were implemented to make the system easier to monitor, debug, and support. Each addresses a specific blind spot in the current system.

---

## Improvement 1: Startup Environment Validation

**What issue it addresses:**
When required environment variables are missing, the system fails in confusing ways at runtime — `JWT_SECRET` silently falls back to an insecure hardcoded default, `DATABASE_URL` causes Prisma to crash with an opaque connection error, and `ASSEMBLYAI_API_KEY` causes the token endpoint to return a 500. None of these failures mention the missing variable, so an operator has to trace through code to understand why.

**Where in the system it applies:**
`instrumentation.ts` (project root) — Next.js's `register()` hook, called once at server startup before any requests are handled.

**How it helps a future maintainer or operator:**
The very first log lines emitted on startup now indicate whether all required env vars are set. If any are missing, a structured warning is logged with the exact variable name and what will break:

```
Before:
  (no output — failures happen silently at first request time)

After:
  {"level":"warn","event":"startup.env_check","data":{"status":"missing","message":"JWT_SECRET is not set — using insecure default (not safe for production)"}}
  {"level":"warn","event":"startup.env_check","data":{"status":"missing","message":"ASSEMBLYAI_API_KEY is not set — real-time transcription will be unavailable"}}
```

When all variables are set:

```
  {"level":"info","event":"startup.env_check","data":{"status":"ok","message":"All required environment variables set"}}
```

**File:** `instrumentation.ts` (new)

---

## Improvement 2: Health Check Endpoint

**What issue it addresses:**
There was no way to check whether the application is running and the database is reachable without making a business-logic API call (which requires authentication). Load balancers, container orchestrators (e.g., Kubernetes readiness probes), and on-call operators need a simple, unauthenticated endpoint that answers "is this service healthy?"

**Where in the system it applies:**
`GET /api/health` — new unauthenticated endpoint at `app/api/health/route.ts`.

**How it helps a future maintainer or operator:**
Returns a JSON payload with:

- **status**: `"healthy"` or `"degraded"`
- **uptime**: server uptime in seconds
- **database.status**: `"ok"` or `"unreachable"`, with `latencyMs` when reachable
- **env**: reports whether `JWT_SECRET`, `ASSEMBLYAI_API_KEY`, and `DATABASE_URL` are configured (values are never exposed — only `"set"` or `"missing"`)

Returns HTTP 200 when healthy, 503 when degraded (database unreachable). Logs a warning on degraded checks.

```
Before:
  No way to check system health without auth credentials

After:
  $ curl http://localhost:3000/api/health
  {
    "status": "healthy",
    "uptime": 342,
    "database": { "status": "ok", "latencyMs": 2 },
    "env": {
      "JWT_SECRET": "set",
      "ASSEMBLYAI_API_KEY": "set",
      "DATABASE_URL": "set"
    }
  }
```

**File:** `app/api/health/route.ts` (new)

---

## Improvement 3: Request Duration Logging

**What issue it addresses:**
The existing structured logs showed _what_ happened (event name, session ID, status code) but not _how long_ it took. When a user reports "the dashboard feels slow," there was no way to identify which API calls are bottlenecks without adding external APM tooling. The three heaviest endpoints had no timing data at all.

**Where in the system it applies:**
Three API route handlers — chosen because they are the most performance-sensitive:

1. **`GET /api/sessions/[id]/state`** — aggregates 5 data sources (session, policy, transcript, checklist, frequency) and computes the threat score. Polled every 2 seconds by the `/call` page.
2. **`POST /api/sessions/[id]/transcript-events`** — ingests transcript events, runs auto-check, and prunes old entries. Called on every finalized AssemblyAI turn.
3. **`POST /api/auth/login`** — involves password hashing and JWT signing. Timing reveals if auth is a bottleneck.

**How it helps a future maintainer or operator:**
Each success and error log now includes `durationMs` — the wall-clock time from request start to response. This lets operators:

- Spot slow requests by grepping logs for high `durationMs` values
- Correlate slowness with data volume (the `/state` log also includes `transcriptEntries` and `frequencySnapshots` counts)
- Detect degradation trends over time without external monitoring

```
Before:
  {"event":"transcript.ingest","sessionId":"abc","data":{"eventCount":5,"totalEntries":120}}

After:
  {"event":"transcript.ingest","sessionId":"abc","data":{"eventCount":5,"totalEntries":120,"durationMs":18}}
```

```
Before:
  (GET /api/sessions/[id]/state had no success log at all)

After:
  {"event":"api.response","sessionId":"abc","data":{"route":"GET /api/sessions/[id]/state","status":200,"durationMs":45,"transcriptEntries":120,"frequencySnapshots":84}}
```

**Files modified:**

- `app/api/sessions/[sessionId]/state/route.ts`
- `app/api/sessions/[sessionId]/transcript-events/route.ts`
- `app/api/auth/login/route.ts`

---

## Summary of Files

| File                                                      | Status      | Improvement                   |
| --------------------------------------------------------- | ----------- | ----------------------------- |
| `instrumentation.ts`                                      | **Created** | Startup env validation        |
| `app/api/health/route.ts`                                 | **Created** | Health check endpoint         |
| `app/api/sessions/[sessionId]/state/route.ts`             | Modified    | Request duration logging      |
| `app/api/sessions/[sessionId]/transcript-events/route.ts` | Modified    | Request duration logging      |
| `app/api/auth/login/route.ts`                             | Modified    | Request duration logging      |
| `docs/final/week13-observability.md`                      | **Created** | This document (Deliverable C) |

## Related PR

- PR: #59 (`feat/week13-observability`)
