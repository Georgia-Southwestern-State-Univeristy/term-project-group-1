# Week 13 — Refactoring + Code Health Improvements

## Code Health Problems Identified

### Problem 1: Duplicated Request Validation Boilerplate + Inconsistent Frequency Validation (Refactored)

**What:** Every POST API route handler repeated 15–20 lines of identical boilerplate for JSON body parsing and schema validation:

```typescript
let body: unknown;
try {
  body = await request.json();
} catch {
  logger.error("api.error", { ... });
  return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
}

const parsed = someSchema.safeParse(body);
if (!parsed.success) {
  const message = formatZodError(parsed.error.issues);
  logger.error("api.error", { ... });
  return NextResponse.json({ error: message }, { status: 400 });
}
```

This pattern was copy-pasted into 4 route handlers:

- `POST /api/policies` (`app/api/policies/route.ts`)
- `POST /api/sessions` (`app/api/sessions/route.ts`)
- `POST /api/sessions/[id]/transcript-events` (`app/api/sessions/[sessionId]/transcript-events/route.ts`)
- `POST /api/sessions/[id]/frequency` (`app/api/sessions/[sessionId]/frequency/route.ts`)

Additionally, the **frequency route** did not use Zod at all. It contained a 60-line hand-rolled `validateFrequencyEvent()` function with deeply nested `if`-statements and manual type-narrowing via `as` casts. Every other route used Zod schemas from `lib/validation/schemas.ts`, making the frequency route an inconsistency in the codebase.

**Why it was a problem:**

- **DRY violation:** 60+ lines of duplicated validation logic across 4 files.
- **Inconsistency:** Three routes used Zod; one used a hand-rolled validator with different error message formats.
- **Maintenance burden:** Any change to validation behavior (e.g., error response format, logging fields) had to be replicated in 4 places.
- **Type safety gap:** The frequency route used `as` casts to narrow `unknown` to concrete types after hand-rolled checks, while Zod-based routes got full type inference for free.

---

### Problem 2: Duplicated Client-Side Types and UI Constants (Deferred)

**What:** Multiple page components (`call/page.tsx`, `history/page.tsx`) redefine the same TypeScript interfaces and Tailwind color constants locally instead of importing them from a shared location:

- `ChecklistRow` — defined identically in `call/page.tsx:12–16` and `history/page.tsx:25–29` (already exists as `ChecklistStateRow` in `lib/domain/types.ts:70–74`)
- `TranscriptEntry` — defined identically in `call/page.tsx:18–23` and `history/page.tsx:19–23` (already exists in `lib/domain/types.ts:50–59`)
- `ThreatScore` — defined identically in both pages (exists as `ThreatScoreBreakdown` in `lib/domain/types.ts:95–101`)
- `LEVEL_COLORS` and `LEVEL_BG` — identical Tailwind class maps duplicated in both pages
- `authHeaders()` helper — reimplemented in both pages with slightly different `getToken()` strategies (cookies vs. localStorage)

**Why it was a problem:**

- **Divergence risk:** If the domain type changes (e.g., adding a `speaker` field to `TranscriptEntry`), page-local copies won't update.
- **Maintenance burden:** UI color changes require updating 2+ files.
- **Inconsistent auth behavior:** `call/page.tsx` reads tokens from cookies while `history/page.tsx` reads from localStorage — a subtle bug vector.

**Why deferred:** This is a frontend-only change with lower blast radius than the API validation refactor. The page components still function correctly; the risk is future divergence rather than current breakage. Recommended for Week 14.

---

## Refactor Completed: Problem 1

### What Changed

1. **New `frequencyEventSchema` added to `lib/validation/schemas.ts`**
   - Replaces the 60-line hand-rolled `validateFrequencyEvent()` function
   - Validates all 5 required fields: `dominantFrequencyHz`, `frequencyBins`, `sampleRateHz`, `fftSize`, `binResolutionHz`
   - Enforces the same constraints as the old validator (non-negative, finite, positive, integer, max array length 4096)
   - Provides type inference via `z.infer<typeof frequencyEventSchema>`

2. **New `parseRequestBody()` utility created at `lib/validation/parseRequestBody.ts`**
   - Generic function: `parseRequestBody<T>(request, schema, route, sessionId?)`
   - Handles JSON parsing errors (returns 400 with "Invalid JSON body")
   - Handles Zod validation failures (returns 400 with field-level error message via `formatZodError`)
   - Logs all failures with the route name and optional session ID for traceability
   - Returns a discriminated union (`{ success: true, data } | { success: false, response }`) matching the existing `authenticateRequest()` pattern

3. **All 4 POST route handlers updated** to use `parseRequestBody()` instead of inline boilerplate:
   - `app/api/policies/route.ts` — removed 17 lines of boilerplate
   - `app/api/sessions/route.ts` — removed 15 lines of boilerplate
   - `app/api/sessions/[sessionId]/transcript-events/route.ts` — removed 17 lines of boilerplate
   - `app/api/sessions/[sessionId]/frequency/route.ts` — removed 80+ lines (60-line validator + 15 lines of parsing boilerplate)

### Files Affected

| File | Change |
|------|--------|
| `lib/validation/schemas.ts` | Added `frequencyEventSchema` Zod schema |
| `lib/validation/parseRequestBody.ts` | **New file** — shared JSON parse + validate utility |
| `app/api/policies/route.ts` | Replaced inline validation with `parseRequestBody` |
| `app/api/sessions/route.ts` | Replaced inline validation with `parseRequestBody` |
| `app/api/sessions/[sessionId]/transcript-events/route.ts` | Replaced inline validation with `parseRequestBody` |
| `app/api/sessions/[sessionId]/frequency/route.ts` | Removed hand-rolled validator, replaced with `frequencyEventSchema` + `parseRequestBody` |
| `app/__tests__/parse-request-body.test.ts` | **New file** — 16 tests covering the refactored code |

### Why the New Structure Is Better

- **Single source of truth:** Validation boilerplate lives in one place. Changing error format, logging structure, or response shape requires editing one file.
- **Consistent validation strategy:** All routes now use Zod schemas. No more hand-rolled validators with different error formats.
- **Type-safe by default:** `parseRequestBody` returns `z.infer<T>` — callers get fully typed data without `as` casts.
- **Reduced route handler size:** Each route handler is 15–80 lines shorter, making business logic easier to read.
- **Follows existing patterns:** The discriminated-union return type mirrors `authenticateRequest()`, so the calling pattern is familiar to anyone working in this codebase.

### Tests Added

**File:** `app/__tests__/parse-request-body.test.ts` (16 tests)

**`parseRequestBody` utility tests (4):**
- Returns parsed data for valid requests
- Returns 400 for malformed JSON
- Returns 400 with field-level error messages for schema violations
- Returns 400 for completely wrong input shape

**`frequencyEventSchema` tests (12):**
- Accepts valid frequency events
- Accepts zero for `dominantFrequencyHz` (edge case: silence)
- Accepts empty `frequencyBins` array
- Rejects negative `dominantFrequencyHz`
- Rejects `NaN` values
- Rejects `Infinity` values
- Rejects zero `sampleRateHz` (must be positive)
- Rejects non-integer `fftSize`
- Rejects zero `fftSize`
- Rejects non-number elements in `frequencyBins`
- Rejects missing required fields
- Rejects `frequencyBins` exceeding max length (4096)

All 17 pre-existing tests covering the affected routes continue to pass, confirming behavior preservation.

### Related PR

- PR: TBD (this branch: `refactor/extract-request-validation-helper`)
- Teammate's PR: #56 (sprint goal / hand-off)
