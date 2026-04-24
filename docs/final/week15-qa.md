# Deliverable B: Final QA Checklist & Demo Path Verification

**File Path:** `/docs/final/week15-qa.md`

---

## 1. Final QA Checklist (10 Required Checks)

| Check Category       | Verification Step                                                   | Expected Result                                                                  |
| -------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Startup / Deploy** | 1. Fresh clone + `npm install` + `npx prisma migrate deploy`.       | System initializes without interactive prompts or errors.                        |
| **Environment**      | 2. Validate `.env` loading (confirmed migration from `.env.local`). | `DATABASE_URL` and `ASSEMBLYAI_API_KEY` are detected by both Next.js and Prisma. |
| **Health Check**     | 3. Access `GET /api/health`.                                        | Returns HTTP 200 with "healthy" status and database latency.                     |
| **Auth / Access**    | 4. Log in as `agent@sentinel.local`.                                | Successfully authenticates and receives a valid JWT.                             |
| **Auth / Access**    | 5. Attempt to access Supervisor-level history as an Agent.          | Returns HTTP 403 Forbidden via ownership-enforcement logic.                      |
| **Core Workflow**    | 6. Initialize AudioWorklet in Firefox.                              | Microphone stream starts without engine-compatibility errors.                    |
| **Core Workflow**    | 7. Speak a specific compliance phrase (e.g., "Privacy Notice").     | The associated checklist item marks as "Complete" in the UI.                     |
| **Error Handling**   | 8. Simulate a WebSocket drop (disconnect internet).                 | UI displays a "Connection Lost" banner with instructions to restart.             |
| **Usability**        | 9. Verify Composite Threat Score updates.                           | Score reacts dynamically to vocal frequency stress and keywords.                 |
| **Persistence**      | 10. End session and view `/history`.                                | Session metadata and full transcript are successfully retrieved from PostgreSQL. |

---

## 2. Exact Demo Path (15 Minutes)

**Total Time Budget:** 15 Minutes

### Phase 1: The Vision & Strategy (3.5 Min - Jaxon)

- **Intro:** Introduce Sentinel as the security co-pilot.
- **Tech Overview:** Briefly highlight the "Modern Monolith" (Next.js / Prisma / Postgres).
- **Quality Stats:** Mention the 100+ tests and 100% RC stability.

---

### Phase 2: Live System Demo (8 Min - Ivan)

**The Happy Path:**

- Show the `/api/health` check to prove the system is live.
- Log in and select the "HIPAA Basic" policy.
- Start the session. Narrate the backend events as Jaxon speaks.
- Show the Composite Threat Score and Auto-Checklist in action.
- End the session and navigate to History to prove persistence.

---

### Phase 3: Wrap-Up & Defense (3.5 Min - Jaxon)

- **Security Summary:** Discuss the JWT/RBAC model and Zod validation.
- **Future Roadmap:** Mention the deferred search and pagination items.
- **Conclusion:** Final value proposition for the cybersecurity training industry.

---

## 3. Rehearsal Log

**What succeeded during rehearsal:**  
End-to-end transcription and auto-checking worked flawlessly on both Chrome and Firefox.

**What was a little hard to understand:**  
The specific environment configuration requirement (splitting `.env` vs `.env.local`) initially caused startup failures on clean clones because the Prisma CLI was not auto-loading variables.

**What was fixed as a result:**  
Canonicalized all environment configuration to a single `.env` file and added it to `.gitignore` to ensure a non-interactive, reproducible run path (PR #62).
