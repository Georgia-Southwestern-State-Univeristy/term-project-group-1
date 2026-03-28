# Deliverable E: Known Issues & Beta Readiness Snapshot

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)  
**Date:** March 26, 2026

---

## 1. What Works Now

- **Persistent Data Layer:**  
  All session, policy, and user data is successfully migrated to a persistent PostgreSQL database via Prisma ORM

- **Secure Authentication & RBAC:**  
  JWT-based login is fully implemented with enforced Role-Based Access Control, ensuring Agents can only access their own session data while Supervisors have global audit rights

- **Composite Threat Scoring:**  
  A real-time engine successfully weights:
  - Vocal frequency stress (35%)
  - Checklist compliance (35%)
  - Textual keywords (30%)  
    Into a live risk percentage

- **Memory-Safe Transcription:**  
  The system utilizes character-based windowing logic to prevent memory bloat during long call sessions

- **Hardened Input Validation:**  
  API routes are protected by Zod-based schema validation to reject malformed payloads and oversized audio buffers

---

## 2. Known Issues

| Issue                  | Severity | Description                                                                                                     |
| ---------------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| Firefox Audio Capture  | High     | The AudioWorklet fails to initialize on non-Chromium engines, preventing Firefox users from starting live calls |
| WebSocket Connectivity | Medium   | Sudden network drops cause the transcription stream to hang without an automatic reconnection attempt           |
| UI Stale State         | Low      | The checklist UI occasionally retains "checked" states from previous sessions until a manual refresh occurs     |

---

## 3. Deferred Items

- **Multi-Factor Authentication (MFA):**  
  While JWT security is solid, MFA was intentionally pushed to the post-Beta roadmap to prioritize core signal processing stability

- **Advanced Historical Search:**  
  Basic session retrieval from the `/history` view is functional, but advanced keyword searching within archived transcripts is deferred to Sprint 6 (Week 12)

- **Multi-Tenant Org Management:**  
  Environment-based configuration is ready, but full "Organization"-level administrative controls are deferred for this release

---

## 4. Beta Readiness Judgment

The Sentinel team is on track for the Week 12 Beta launch.

The critical "heavy lifting"—specifically:

- Transition to a persistent PostgreSQL database
- Implementation of secure JWT-based authentication
- Development of the Composite Threat Score logic

—has been completed and verified by automated tests.

If the currently in-progress Firefox compatibility and WebSocket reconnect logic are finalized this week, the system will be feature-complete and stable for end-user testing.

---
