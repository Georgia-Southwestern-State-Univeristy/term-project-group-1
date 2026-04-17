# Deliverable A: Release Candidate Summary

**RC Tag:** rc-v0.2  
**Date:** April 17, 2026  
**Project Board Link:** Sentinel Week 14 Release Board  https://github.com/orgs/Georgia-Southwestern-State-Univeristy/projects/27/views/3

---

## 1. Core Workflows (Stable)

The following workflows are considered feature-complete and verified by 90+ automated tests:

- **Secure Multi-Role Access:** Authentication via JWT with enforced RBAC for Agents and Supervisors.  
- **Live Assisted Transcription:** Real-time speech-to-text via AssemblyAI with character-based windowing for memory safety.  
- **Composite Threat Scoring:** Dynamic risk calculation using the weighted $35/35/30$ formula (vocal stress, checklist, and keywords).  
- **Historical Audit & Retrieval:** Permanent session archiving in PostgreSQL with role-based retrieval via the `/history` dashboard.  

---

## 2. Major Differences from Beta

- **Unified Validation Architecture:**  
  Replaced 80+ lines of hand-rolled, inconsistent validation logic with a shared `parseRequestBody()` utility and declarative Zod schemas (PR #57).

- **Full-System Observability:**  
  Implemented an unauthenticated `/api/health` diagnostic endpoint and request duration logging (`durationMs`) to identify performance bottlenecks in real-time (PR #59).

- **Defensive Startup Guards:**  
  Added a `register()` hook to validate environment variables (`DATABASE_URL`, `ASSEMBLYAI_API_KEY`) at boot time, preventing silent runtime failures.

- **Synchronized Documentation:**  
  The `README.md` and hand-off docs have been overhauled to reflect the mandatory Prisma/PostgreSQL requirements, resolving previous documentation drift.

---

## 3. Remaining Known Risks

- **Browser Compatibility (Firefox):**  
  The primary audio capture remains Chromium-dependent; users on Gecko-based engines cannot currently stream audio.

- **Auth Rotation:**  
  Logout currently clears the client-side cookie but does not explicitly revoke the JWT on the server side.

- **Dashboard Component Bloat:**  
  The `/call` page has grown into a monolithic component that requires decomposition into sub-modules for long-term supportability.

---

## 4. Final Push: Week 15–16 Plan

To reach the v1.0 production release, the team must complete the following with specific acceptance criteria:

| Task                  | Acceptance Criteria                                                                 |
|-----------------------|--------------------------------------------------------------------------------------|
| Firefox Fallback      | Implement a MediaRecorder fallback that allows Firefox to stream audio with < 500ms latency |
| WebSocket Reconnect   | Add a heartbeat listener that auto-restores the transcription stream within 3 seconds of a network blip |
| Component Refactor    | Extract the "Stress Graph" and "Transcript Feed" into isolated components to reduce `/call` page size by 40% |
| Token Revocation      | Implement a deny list in Redis or PostgreSQL to track and invalidate revoked tokens upon logout |

---