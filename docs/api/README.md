# Sentinel API — Developer Reference

**Deliverable:** Week 14, Deliverable D — API / Interface Documentation
**Canonical machine-readable contract:** [`openapi.yaml`](./openapi.yaml)
(OpenAPI 3.0.3)
**Audience:** engineers integrating with or maintaining the Sentinel
Dashboard backend.

This README is the human-readable companion to `openapi.yaml`. It covers
things OpenAPI doesn't express well: the streaming-audio pipeline, the
auth conventions used across routes, the internal module map behind the
HTTP surface, and the known gaps at release-candidate time.

---

## 1. Endpoint map

All routes are served by Next.js App Router handlers under `app/api/*`.

| Method + Path                                      | Auth     | Purpose                                                                            |
| -------------------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `POST /api/auth/login`                             | public   | Exchange credentials for a JWT (and set the `token` cookie).                       |
| `GET /api/health`                                  | public   | Service + database health probe. 200 healthy / 503 degraded.                       |
| `POST /api/assemblyai/token`                       | public\* | Mint a short-lived AssemblyAI streaming token (60s).                               |
| `POST /api/policies`                               | JWT      | Create a policy; checklist is auto-derived from the text.                          |
| `GET /api/policies`                                | JWT      | List policy summaries.                                                             |
| `GET /api/policies/{policyId}`                     | JWT      | Get one policy + its checklist.                                                    |
| `POST /api/sessions`                               | JWT      | Create an active session owned by the caller.                                      |
| `GET /api/sessions`                                | JWT      | List sessions visible to the caller (agents: own only; supervisors: all).          |
| `POST /api/sessions/{sessionId}/transcript-events` | JWT + 🔒 | Append transcript events (≤50 per batch), auto-check checklist.                    |
| `POST /api/sessions/{sessionId}/frequency`         | JWT + 🔒 | Append one FFT snapshot (for vocal-stress score).                                  |
| `GET /api/sessions/{sessionId}/frequency`          | JWT + 🔒 | List all frequency snapshots for a session.                                        |
| `GET /api/sessions/{sessionId}/state`              | JWT + 🔒 | Full state snapshot (session + transcript + checklist + frequency + threat score). |
| `POST /api/sessions/{sessionId}/end`               | JWT + 🔒 | Idempotently mark a session `ended`.                                               |

**Legend.** `JWT` = requires a valid token (header **or** cookie). `🔒` =
session-ownership check (agents only see sessions they own; supervisors
bypass).
`public*` = currently unauthenticated; see §6 ("Known gaps").

See `openapi.yaml` for full request/response schemas and example payloads.

---

## 2. Authentication conventions

### 2.1 Token issuance

`POST /api/auth/login` issues an **HS256 JWT** signed with `JWT_SECRET`
(see the runbook for environment setup). Claims:

- `sub` — user id
- `email` — user email
- `role` — `"agent"` or `"supervisor"`
- `iat` / `exp` — issued-at and expiry (**8 hours after issue**)

The same JWT is returned two ways:

1. In the JSON response body under `token`.
2. As an `HttpOnly` cookie: `token=<jwt>; HttpOnly; Path=/; SameSite=Strict`.

### 2.2 Token presentation

Every protected route accepts **either** transport. The server checks the
`Authorization` header first, then falls back to the `token` cookie
(`lib/auth.ts:authenticateRequest`):

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

or

```http
Cookie: token=eyJhbGciOiJIUzI1NiJ9...
```

Pick one per request. Browser clients rely on the cookie (set
automatically at login); `curl` examples and test suites use the header.

### 2.3 Failure shapes

| HTTP | Body                                            | When                                                             |
| ---- | ----------------------------------------------- | ---------------------------------------------------------------- |
| 401  | `{ "error": "Authentication required" }`        | No token presented.                                              |
| 401  | `{ "error": "Invalid or expired token" }`       | Token was malformed, signed with the wrong key, or past expiry.  |
| 401  | `{ "error": "Invalid credentials" }`            | Login: email/password mismatch.                                  |
| 403  | `{ "error": "Forbidden: you do not own..." }`   | Agent tried to touch a session owned by another agent.           |
| 400  | `{ "error": "<field-specific message>" }`       | Malformed JSON or Zod validation error. Path prefixes the field. |
| 404  | `{ "error": "Session not found" }` / "Policy …" | Target resource doesn't exist.                                   |
| 409  | `{ "error": "Session is not active" }`          | Trying to ingest into an `ended` session.                        |

Error bodies are always `{ "error": string }`. Validation error messages
embed a JSON-pointer-style path for Zod issues, e.g.
`events[0].text: 'text' must be a non-empty string`.

---

## 3. Real-time transcription flow

AssemblyAI provides the streaming STT. The HTTP API is only one half of
this flow — the other half is a browser-side WebSocket connection to
AssemblyAI directly. The server's job is to mint a short-lived token and
stay out of the audio path.

```
┌─────────── browser ───────────┐         ┌──────── Sentinel server ────────┐
│  /demo page + AudioWorklet    │         │                                  │
│                               │         │                                  │
│  1. POST /api/assemblyai/token├────────▶│ POST AssemblyAI /v3/token        │
│  2. Returns { token, 60s }    │◀────────┤   (auth = ASSEMBLYAI_API_KEY)    │
│                               │         │                                  │
│  3. Open wss://… with token   │═════════▶ (no Sentinel hop)                │
│  4. Stream PCM, receive text  │════════ AssemblyAI streaming endpoint     │
│                               │                                           │
│  5. POST transcript events ───┼────────▶ /api/sessions/{id}/transcript-events
│  6. POST frequency snapshots ─┼────────▶ /api/sessions/{id}/frequency    │
└───────────────────────────────┘         └──────────────────────────────────┘
```

Key implications for integrators:

- The AssemblyAI **master API key** is never sent to the browser. Only
  the ephemeral token (TTL = 60s) leaves the server.
- Transcript events are ingested by the client after AssemblyAI returns
  them — the server does not subscribe to the WebSocket. This keeps the
  server out of the per-word latency path.
- Frequency snapshots come from a local AudioWorklet
  (`public/worklets/pcm-processor.js`); they never touch AssemblyAI.
- Both ingest endpoints batch: transcript events allow up to **50 per
  request**, frequency takes one snapshot at a time.

---

## 4. Session state polling

The `/call` and `/history` UIs poll `GET /api/sessions/{id}/state` every
**2 seconds** to render a unified view. The response is deliberately
rolled up server-side so the client doesn't have to stitch together five
endpoints:

- `session` — base record (status, createdAt, endedAt)
- `transcript.entries` — ordered transcript rows (interim + final)
- `transcript.fullText` — concatenated final text (convenience)
- `checklistState[]` — each checklist item with a `checked` boolean
- `frequencySnapshots[]` — chronological FFT snapshots
- `threatScore` — composite score and four subcomponents
  (`frequencyScore`, `complianceScore`, `keywordScore`, plus a
  discrete `level`: `low` / `medium` / `high` / `critical`)

The threat-score weights (35 % vocal / 35 % compliance / 30 % keyword)
live in `lib/services/threatScoreService.ts`; they are not configurable
at the API layer.

---

## 5. Internal module map

The HTTP handlers are thin: they authenticate, validate, delegate to a
service, and format the response. The real logic lives in `lib/`:

```
app/api/*/route.ts         — HTTP entry points (this spec)
lib/auth.ts                — JWT signing/verification, ownership checks
lib/validation/
  schemas.ts               — Zod schemas for every request body
  parseRequestBody.ts      — uniform 400 on bad JSON / bad shape
lib/services/
  policyService.ts         — policy CRUD + checklist generation
  sessionService.ts        — session lifecycle (create/list/end)
  transcriptService.ts     — transcript persistence + retrieval
  checklistService.ts      — auto-check matching against transcript
  threatScoreService.ts    — composite score computation
lib/repositories/          — Prisma-backed data access
lib/domain/types.ts        — shared TypeScript interfaces
```

The service/repository split exists so route handlers remain simple and
tests can target the services directly
(`app/__tests__/*.test.ts` — 108 tests as of the Week 14 runbook).

---

## 6. Known gaps at RC time

These are not spec bugs — they are deliberate limitations tracked in
`docs/final/week14-triage.md`:

- **`POST /api/assemblyai/token` is unauthenticated.** Any caller can
  mint a 60-second streaming token. Acceptable for the single-tenant
  prototype; will be gated by auth before v1.0.
- **No server-side JWT revocation.** Logging out clears the cookie but
  doesn't invalidate the token server-side. A compromised token remains
  valid until it expires (8h).
- **No rate limiting** on any route.
- **Session listing is unpaginated** — the `/history` UI fetches all
  ended sessions in a single response. Will not scale past tens of
  thousands of sessions per user.
- **Transcript search is absent** — full-text search over archived
  transcripts is a post-v1.0 item.

Report the first four in `docs/final/week14-triage.md` before filing new
issues.

---

## 7. Changelog

- **0.2.0 (Week 14).** Full rewrite. Added auth, health, sessions list,
  session state, transcript events, frequency, AssemblyAI token, and
  session end. Added `bearerAuth` + `cookieAuth` security schemes and
  documented ownership rules, 401/403/409 semantics, and the
  streaming-audio flow. Removed the Week 6 legacy `POST /api/session`
  stub (dead code).
- **0.1.0 (Week 6 MVP).** Initial skeleton covering `/policies` and the
  original `POST /sessions` shape.
