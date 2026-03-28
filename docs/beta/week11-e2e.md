# Deliverable B: End-to-End Workflow Proof

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)  
**Date:** March 26, 2026

---

## 1. Primary Workflow: "Secured Threat-Assisted Call Lifecycle"

This workflow demonstrates the core **"Sentinel"** value proposition: a secure, multi-stage process where an agent conducts a monitored call that results in persistent, audited threat data.

### Step-by-Step Execution

1. **Authentication**  
   The user authenticates via the secure `/login` portal using JWT-based session tokens.

2. **Configuration**  
   The user selects a specific security policy from the dashboard, which loads the corresponding keyword weights and compliance checklists.

3. **Live Ingestion**  
   A transcription session is initiated; real-time PCM audio is streamed to the backend and processed for both text and frequency-based stress indicators.

4. **Real-time Analysis**  
   The Composite Threat Score engine dynamically calculates a risk percentage based on vocal frequency stress, keyword hits, and checklist progress.

5. **Termination & Persistence**  
   Upon ending the call, the system closes the WebSocket and migrates all in-memory transcript and score data to the PostgreSQL database.

6. **Audit Retrieval**  
   The user navigates to the `/history` view to verify that the session, final score, and full transcript are retrieved correctly from the persistent store.

---

## 2. Workflow Documentation

### Entry Point and User Role

- **Entry Point:** The `/login` page followed by `/demo` (full workflow) or `/call` (session-only)
- **User Role:** Agent (Standard User)

**Note:** While Supervisors can view history, the Agent is the primary actor for the live call workflow.

---

### Major System Components Involved

- **Authentication Layer:** JWT management via `jose` (HS256 signing/verification) to secure session state
- **Transcription Engine:** AssemblyAI integration for real-time speech-to-text conversion
- **Acoustic Signal Pipeline:** 2048-point FFT analysis for dominant frequency (Hz) extraction
- **Composite Threat Scoring Engine:** Weighted logic combining textual and vocal signals
- **Persistence Layer:** Prisma ORM and PostgreSQL database for durable session archiving

---

### Expected Output / System State at Completion

- **Database State:**  
  A new record exists in the `sessions` table with a status of `ended` and a non-null `endedAt` timestamp

- **Data Integrity:**
  The final record and its related tables contain:
  - `transcript_entries` — all ingested transcript text (pruned to 50K char window)
  - `frequency_snapshots` — FFT data used to compute the frequency stress component
  - `checklist_states` — which checklist items were auto-checked during the call
  - `ownerId` matching the authenticated agent

- **User UI:**
  The `/call` page shows an "Ended" badge. The agent navigates to `/history` to view the archived session’s transcript, checklist, and threat score breakdown.

---

## 3. Implementation Evidence

Each workflow step is mapped to the source files and PRs that implement it.

### Step 1: Authentication

| Artifact | Path / Reference |
|----------|-----------------|
| Login page | `app/login/page.tsx` |
| Login API | `app/api/auth/login/route.ts` |
| JWT signing & verification | `lib/auth.ts` (uses `jose` HS256, 8h expiry) |
| Role-based access control | `lib/auth.ts` — `assertOwnership()` (supervisors bypass, agents own-only) |
| PR | [#44 — Add JWT auth, session ownership, and login page](https://github.com/Georgia-Southwestern-State-Univeristy/term-project-group-1/pull/44) |

### Step 2: Configuration (Policy Selection)

| Artifact | Path / Reference |
|----------|-----------------|
| Policy CRUD API | `app/api/policies/route.ts` (POST creates policy + auto-generates checklist from text) |
| Policy service | `lib/services/policyService.ts` — `createPolicyFromText()` |
| Call page policy selector | `app/call/page.tsx` — fetches `GET /api/policies`, renders `<select>` |
| Demo page policy creation | `app/demo/page.tsx` — inline form for name + text |

### Step 3: Live Ingestion

| Artifact | Path / Reference |
|----------|-----------------|
| Session creation API | `app/api/sessions/route.ts` — `POST` creates session linked to policy + user |
| Transcript event ingestion | `app/api/sessions/[sessionId]/transcript-events/route.ts` |
| Transcript service (pruning) | `lib/services/transcriptService.ts` — 50K char window limit |
| Frequency ingestion API | `app/api/sessions/[sessionId]/frequency/route.ts` — POST accepts FFT snapshots |
| AssemblyAI WebSocket streaming | `app/demo/page.tsx` — real-time PCM audio via `wss://streaming.assemblyai.com` |
| AudioWorklet processor | `public/worklets/pcm-processor.js` |
| PR | [#47 — PostgreSQL migration, port detection, and threat scoring](https://github.com/Georgia-Southwestern-State-Univeristy/term-project-group-1/pull/47) |

### Step 4: Real-time Analysis

| Artifact | Path / Reference |
|----------|-----------------|
| Threat score computation | `lib/services/threatScoreService.ts` — `computeThreatScore()` |
| Score weights config | `lib/config/threatScore.ts` — frequency 35%, compliance 35%, keyword 30% |
| Session state API (returns score) | `app/api/sessions/[sessionId]/state/route.ts` |
| Auto-checklist matching | `lib/services/checklistService.ts` — `autoCheckChecklist()` |
| PR | [#47 — PostgreSQL migration, port detection, and threat scoring](https://github.com/Georgia-Southwestern-State-Univeristy/term-project-group-1/pull/47) |

### Step 5: Termination & Persistence

| Artifact | Path / Reference |
|----------|-----------------|
| Session end API (idempotent) | `app/api/sessions/[sessionId]/end/route.ts` |
| Session service | `lib/services/sessionService.ts` — `endSession()` sets `status: "ended"`, `endedAt` |
| Prisma schema (all tables) | `prisma/schema.prisma` — sessions, transcript_entries, frequency_snapshots, checklist_states |
| Repository layer | `lib/repositories/sessionRepo.ts`, `transcriptRepo.ts`, `frequencyRepo.ts`, `checklistStateRepo.ts` |
| PR | [#47 — PostgreSQL migration, port detection, and threat scoring](https://github.com/Georgia-Southwestern-State-Univeristy/term-project-group-1/pull/47) |

### Step 6: Audit Retrieval (History)

| Artifact | Path / Reference |
|----------|-----------------|
| Session list API | `app/api/sessions/route.ts` — `GET` with `?status=ended` filter, role-based filtering |
| History page | `app/history/page.tsx` — lists ended sessions, expandable detail with transcript/checklist/threat score |
| Navigation bar | `app/components/NavBar.tsx` — global nav (Demo, Call, History, Logout) |
| Session list service | `lib/services/sessionService.ts` — `listSessionsForUser()` |
| Session list repository | `lib/repositories/sessionRepo.ts` — `listSessions()` with Prisma join for policy name |
| Tests | `app/__tests__/api-sessions-list.test.ts` — 5 tests covering auth, role filtering, status filter |
| PR | *(feat/history-page branch — pending)* |

---

## 4. Corrections from Original Draft

| Original claim | Correction | Evidence |
|----------------|-----------|----------|
| Entry point is `/dashboard` | Actual entry is `/demo` or `/call` | No `app/dashboard/` directory exists |
| Auth uses `NextAuth` | Auth uses custom JWT via `jose` only | `lib/auth.ts` imports `SignJWT`, `jwtVerify` from `jose`; no NextAuth dependency |
| Session status `archived` / `completed` | Session status is `"active"` or `"ended"` | `lib/domain/types.ts:26`, `prisma/schema.prisma` |
| Record contains `transcript_text` field | Transcript stored as separate `transcript_entries` rows | `prisma/schema.prisma` — `transcript_entries` table |
| Record contains `composite_threat_score` field | Threat score is computed on-demand from related data | `lib/services/threatScoreService.ts` — `computeThreatScore()` |
