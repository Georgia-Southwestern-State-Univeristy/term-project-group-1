# Week 12 Deliverable C: Test & CI Quality Summary

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)
**Date:** April 3, 2026

---

## 1. Test Summary

| Metric      | Count |
| ----------- | ----- |
| Test suites | 15    |
| Total tests | 82    |
| Passing     | 82    |
| Failing     | 0     |

### Breakdown by Category

#### Unit Tests (31 tests, 4 suites)

| Suite                          | Tests | What it covers                                                                     |
| ------------------------------ | ----- | ---------------------------------------------------------------------------------- |
| `threat-score.test.ts`         | 10    | Threat score computation: frequency, compliance, keyword, and level classification |
| `frequency-repo.test.ts`       | 3     | Frequency snapshot append/retrieve                                                 |
| `transcript-windowing.test.ts` | 9     | Transcript pruning, windowing, fullText assembly                                   |
| `structured-logging.test.ts`   | 9     | Logger JSON output, levels, session context, input validation                      |

#### Integration Tests (33 tests, 7 suites)

| Suite                                  | Tests | What it covers                                                                             |
| -------------------------------------- | ----- | ------------------------------------------------------------------------------------------ |
| `auth-access-control.test.ts`          | 8     | Login, 401 rejection, session ownership, 403, supervisor bypass                            |
| `api-sessions-list.test.ts`            | 5     | Session listing with auth, role filtering, status filter                                   |
| `api-frequency.test.ts`                | 6     | Frequency snapshot POST/GET, 404/409/400 validation                                        |
| `api-session.test.ts`                  | 3     | Legacy session endpoint response shape                                                     |
| `week10-validation-regression.test.ts` | 3     | Input validation: bad policyId, missing fields, transcript bounds                          |
| `policyUploadFlow.test.ts`             | 4     | Policy CRUD: create with checklist, fetch, session link, 404                               |
| `realTimeAutocheck.test.ts`            | 4     | Transcript → checklist auto-matching, case/punctuation normalization, 409 on ended session |

#### Workflow / E2E Tests (13 tests, 2 suites)

| Suite                           | Tests | What it covers                                                                                                           |
| ------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| `week11-reliability.test.ts`    | 6     | Full lifecycle (create→ingest→end→history), session isolation, transcript+checklist integration, failure paths (404/409) |
| `week12-beta-hardening.test.ts` | 4     | Ended session state preservation (archive retrieval), ownership enforcement on session end (403/401), supervisor bypass  |

#### Component Tests (5 tests, 2 suites)

| Suite                | Tests | What it covers                                                   |
| -------------------- | ----- | ---------------------------------------------------------------- |
| `page.test.tsx`      | 1     | Landing page renders                                             |
| `call-page.test.tsx` | 4     | Call page heading, policy selector, button state, fetch on mount |

---

## 2. Workflow Coverage

The primary user workflow is:

```
Login → Create Session → Stream Transcript → Auto-check Checklist → End Session → View History
```

Here is how the test suite covers each step:

| Workflow Step                | Covered By                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Login (auth)**             | `auth-access-control.test.ts` — valid/invalid credentials, token generation                                          |
| **Route protection (401)**   | `auth-access-control.test.ts`, `api-sessions-list.test.ts`, `week12-beta-hardening.test.ts`                          |
| **Create policy**            | `policyUploadFlow.test.ts` — create + checklist generation                                                           |
| **Create session**           | `policyUploadFlow.test.ts`, `week11-reliability.test.ts` — linked to policy, ownerId set                             |
| **Ingest transcript**        | `realTimeAutocheck.test.ts`, `week11-reliability.test.ts` — events stored, fullText built                            |
| **Auto-check checklist**     | `realTimeAutocheck.test.ts`, `week11-reliability.test.ts`, `week12-beta-hardening.test.ts` — phrase matching         |
| **Threat score computation** | `threat-score.test.ts` — frequency, compliance, keyword scoring                                                      |
| **Session ownership (403)**  | `auth-access-control.test.ts`, `week12-beta-hardening.test.ts` — non-owner rejected, supervisor bypass               |
| **End session**              | `week11-reliability.test.ts`, `week12-beta-hardening.test.ts` — idempotent end, 409 on re-ingest                     |
| **View history (archive)**   | `week11-reliability.test.ts` — list ended sessions; `week12-beta-hardening.test.ts` — full state preserved after end |
| **Session isolation**        | `week11-reliability.test.ts` — no data leakage between sessions                                                      |
| **Input validation**         | `structured-logging.test.ts`, `week10-validation-regression.test.ts` — bad types, missing fields                     |

---

## 3. CI Evidence

**CI configuration:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

CI runs on every pull request to `main` and executes:

1. `npm run lint` — ESLint
2. `npm run format:check` — Prettier
3. `npx tsc --noEmit` — TypeScript type check
4. `npm test` — Jest (82 tests)
5. `npm run build` — Next.js production build

**Recent passing run:** [GitHub Actions — CI Quality Checks](https://github.com/Georgia-Southwestern-State-Univeristy/term-project-group-1/actions)

> Link to specific run: check the Actions tab for the most recent green checkmark on `main`. The merge commit for this PR will have a CI run attached.

---

## 4. New Tests Added (Week 12)

Two new tests were added in `__tests__/week12-beta-hardening.test.ts` (4 test cases total):

### Test 1: Ended Session State Preservation

**What it tests:** After a full session lifecycle (create → ingest transcript → auto-check checklist → end), `GET /api/sessions/[id]/state` returns the complete archived state:

- Session shows `status: "ended"` with `endedAt` timestamp
- Transcript entries are preserved with correct `fullText`
- Checklist items that were auto-checked during the session remain checked
- Unchecked items remain unchecked
- Threat score is computed correctly (compliance score > 0 for unchecked items)

**Why it matters:** The `/history` page depends on this endpoint returning full data for ended sessions. Without this test, a regression could silently break the archive retrieval workflow.

### Test 2: Ownership Enforcement on Session End

**What it tests:** The `POST /api/sessions/[id]/end` endpoint enforces access control:

- A non-owner agent receives `403 Forbidden`
- A supervisor can end any session regardless of ownership
- An unauthenticated request receives `401`

**Why it matters:** Session end is a destructive action (it permanently stops transcript ingestion). The auth tests previously covered `GET /state` ownership but not the `POST /end` endpoint. This closes that gap.

---

## 5. Testing Gaps

The following areas are **not** covered by automated tests:

| Gap                                       | Risk   | Reason                                                                                      |
| ----------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| **Real WebSocket streaming (AssemblyAI)** | Medium | Requires live API key; tested manually via `/demo` page                                     |
| **Browser audio capture (AudioWorklet)**  | Low    | Browser API; cannot simulate in Jest/jsdom                                                  |
| **PostgreSQL-specific behavior**          | Medium | Tests use in-memory repos via moduleNameMapper; Prisma query edge cases not covered         |
| **Login page UI flow**                    | Low    | `login/page.tsx` renders a form; tested manually, not via RTL                               |
| **History page UI rendering**             | Low    | `history/page.tsx` tested manually; depends on API responses validated by integration tests |
| **Concurrent request handling**           | Low    | Single-tenant prototype; not a current risk                                                 |
| **Rate limiting**                         | Low    | Not implemented; documented as deferred in Week 11 reliability doc                          |
| **JWT token expiration/refresh**          | Low    | 8-hour expiry; adequate for beta demo sessions                                              |
