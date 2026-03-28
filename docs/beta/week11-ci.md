# Week 11 Deliverable D: Testing & CI

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)
**Date:** March 27, 2026

---

## Tests Added

All tests are in `__tests__/week11-reliability.test.ts` using the `@jest-environment node` pragma with service-level and API-route-level testing.

### Test 1: Full session lifecycle workflow (workflow test)

Tests the complete create -> ingest -> end -> list-via-history workflow:
- Creates a policy and session
- Appends transcript events and verifies storage
- Ends the session and asserts status change
- Lists sessions via `listSessionsForUser()` and confirms the ended session appears

### Test 2: Session isolation (workflow test)

Verifies no state leakage between concurrent sessions:
- Creates two sessions (A and B) for the same policy
- Adds different transcript text to each
- Fetches transcripts independently and asserts each contains only its own data

### Test 3: Transcript ingestion auto-checks checklist (integration test)

Exercises the full stack through actual API route handlers:
- Creates a policy with 3 checklist items
- POSTs transcript via the `transcript-events` route handler
- GETs state via the `state` route handler
- Asserts that matching checklist items are checked and non-matching items are not

This test covers: HTTP request -> route handler -> service -> repository (full stack).

### Test 4: Failure paths (failure-path / regression test)

Three sub-tests covering error responses:
- `GET .../state` with non-existent session -> 404
- `POST .../transcript-events` with non-existent session -> 404
- `POST .../transcript-events` on ended session -> 409

---

## Workflow Coverage

These tests protect the primary end-to-end workflow:

```
login -> start session -> live transcription -> session end -> archive -> retrieve via /history
         [Test 1]         [Test 1, 3]           [Test 1]                  [Test 1]
                          [Test 2: isolation]    [Test 4: failure paths]
```

- **Test 1** covers the full happy path end-to-end
- **Test 2** ensures sessions don't interfere with each other
- **Test 3** verifies the transcript -> checklist auto-check integration
- **Test 4** ensures error cases return correct HTTP status codes

---

## CI Configuration

No changes to `.github/workflows/ci.yml` were needed. The existing pipeline runs:
1. ESLint
2. Prettier check
3. TypeScript type check (`tsc --noEmit`)
4. Jest test suite
5. Next.js production build

---

## PR Links

- PR #51: feat/history-page (includes all Week 11 C & D work)

## CI Evidence

- All 78 tests passing (14 test suites)
- CI run link: https://github.com/Georgia-Southwestern-State-Univeristy/term-project-group-1/actions

## Notes

- No CI failures encountered during development
- The `act()` warnings in `call-page.test.tsx` are pre-existing and do not affect test correctness (React Testing Library async state update timing)
- Tests use in-memory repositories via Jest `moduleNameMapper` — no database required
