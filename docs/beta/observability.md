# Observability Guide

## Where Logs Live and How to View Them

All structured logs are written to **stdout** (`info`, `warn`) and **stderr** (`error`) via the Node.js console. During development, logs appear directly in the terminal running the Next.js dev server:

```bash
npm run dev
```

Every log line is a single JSON object, making it easy to filter with standard tools:

```bash
# View all logs
npm run dev 2>&1 | cat

# Filter for errors only (stderr)
npm run dev 2>/tmp/errors.log

# Pretty-print with jq
npm run dev 2>&1 | jq '.'

# Filter by event type
npm run dev 2>&1 | jq 'select(.event == "session.start")'

# Filter by session ID
npm run dev 2>&1 | jq 'select(.sessionId == "abc-123")'
```

In a production deployment (e.g., Vercel, Docker, PM2), these logs are captured by the platform's log aggregator and can be searched via its dashboard.

---

## Log Format

Every log entry follows this JSON schema:

```json
{
  "timestamp": "2026-03-14T20:15:32.041Z",
  "level": "info | warn | error",
  "event": "event.name",
  "sessionId": "optional-session-uuid",
  "data": { "...additional context..." }
}
```

| Field       | Type   | Always present | Description                                      |
|-------------|--------|----------------|--------------------------------------------------|
| `timestamp` | string | Yes            | ISO 8601 timestamp of when the event occurred     |
| `level`     | string | Yes            | `info`, `warn`, or `error`                        |
| `event`     | string | Yes            | Dot-separated event identifier (see table below) |
| `sessionId` | string | No             | Call session UUID, included when available         |
| `data`      | object | No             | Event-specific context (see table below)          |

---

## What Events Are Logged

### User Actions (level: `info`)

| Event               | Route                                    | Data fields                                    |
|---------------------|------------------------------------------|-------------------------------------------------|
| `policy.upload`     | `POST /api/policies`                     | `policyId`, `name`, `checklistItemCount`        |
| `session.start`     | `POST /api/sessions`                     | `policyId`                                      |
| `session.end`       | `POST /api/sessions/[id]/end`            | _(none beyond sessionId)_                       |
| `transcript.ingest` | `POST /api/sessions/[id]/transcript-events` | `eventCount`, `totalEntries`, `latestText`   |

### Errors (level: `error`)

All errors are logged as `api.error` with contextual `data`:

| Scenario                    | Route                                       | Data fields                              |
|-----------------------------|---------------------------------------------|------------------------------------------|
| Invalid JSON body           | policies, sessions, transcript-events        | `route`, `status` (400), `reason`        |
| Missing/invalid field       | policies, sessions, transcript-events        | `route`, `status` (400), `field`         |
| Invalid transcript event    | transcript-events                            | `route`, `status` (400), `reason` (includes index) |
| Session not found           | transcript-events, state, end                | `sessionId`, `route`, `status` (404)     |
| Policy not found            | sessions                                     | `policyId`, `route`, `status` (404)      |
| Session not active          | transcript-events                            | `sessionId`, `route`, `status` (409), `currentStatus` |
| Missing API key             | assemblyai/token                             | `route`, `status` (500), `reason`        |
| Upstream API failure        | assemblyai/token                             | `route`, `status` (502), `upstreamStatus`, `upstreamResponse` |

---

## How to Correlate a User Action to a Log Entry

### By Session ID

The primary correlation key is `sessionId`. Every log entry related to a call session includes this field. To trace the full lifecycle of a single call:

```bash
npm run dev 2>&1 | jq 'select(.sessionId == "20536636-b7fc-4b83-8c1f-18414a8f8fa8")'
```

This returns all events for that session in chronological order: `session.start` -> `transcript.ingest` (repeated) -> `session.end`, plus any errors that occurred.

### By Timestamp

All entries include an ISO 8601 `timestamp`. To find what happened around a specific time:

```bash
npm run dev 2>&1 | jq 'select(.timestamp > "2026-03-14T20:15:00" and .timestamp < "2026-03-14T20:16:00")'
```

### By Event Type

Filter by the `event` field to see all occurrences of a specific action:

```bash
# All policy uploads
jq 'select(.event == "policy.upload")'

# All errors
jq 'select(.level == "error")'

# All errors for a specific route
jq 'select(.event == "api.error" and .data.route == "POST /api/sessions")'
```

### Correlation Workflow Example

A user reports "my session stopped working." To investigate:

1. Get their session ID from the UI or ask the user
2. Filter logs: `jq 'select(.sessionId == "<id>")'`
3. Look for `api.error` entries — the `data` object contains the HTTP status, route, and reason
4. Check timestamps to establish the sequence of events

---

## Implementation Reference

The logger is defined in [`lib/logger.ts`](../../lib/logger.ts). It exposes three methods:

```typescript
import { logger } from "@/lib/logger";

logger.info("event.name", { sessionId: "...", data: { ... } });
logger.warn("event.name", { data: { ... } });
logger.error("event.name", { sessionId: "...", data: { ... } });
```

To add logging to a new route or service, import the logger and call the appropriate method at the success path (`info`) and each error return path (`error`).
