# Deliverable A: Final Sprint Goal & Closing Backlog

**File Path:** `/docs/final/week15-sprint.md`  
**Project Board Link:** Sentinel Final Project Board https://github.com/orgs/Georgia-Southwestern-State-Univeristy/projects/27/views/3

---

## 1. Sprint Goal

Finalize the Sentinel production package through rigorous end-to-end QA, demo rehearsal, and the remediation of final documentation and environment misalignments to ensure 100% presentation readiness.

---

## 2. Committed Items (Closing Backlog)

| Item                               | Owner | Acceptance Criteria                                                                                                                                                  |
| ---------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Auth Hardening (Revocation)** | Ivan  | • Implement server-side token invalidation upon logout to satisfy security requirements.<br>• Verify 401 status for subsequent requests with old tokens.             |
| **2. WebSocket Resilience**        | Ivan  | • Add heartbeat/ping logic and exponential backoff for AssemblyAI stream drops.<br>• Verify auto-recovery during intermittent network blips.                         |
| **3. State Sanitization**          | Jaxon | • Implement `resetState` hooks to ensure checklists and transcripts do not persist between sessions.                                                                 |
| **4. Deployment Guide Alignment**  | Jaxon | • Update `deploy.md` to use `.env` (canonical) and `npx prisma migrate deploy` to match PR #62.                                                                      |
| **5. Demo & Presentation Prep**    | Team  | • Conduct 3 full rehearsals of the presentation "Happy Path" (Login → Policy → Call → Audit).<br>• Finalize 12-slide presentation deck and pre-recorded backup demo. |
| **6. Hand-Off Readiness Audit**    | Jaxon | • Perform a final audit of `/docs/handoff/` to ensure no "tribal knowledge" is required for setup.                                                                   |
| **7. Individual Contributions**    | Team  | • Finalize and commit `week15-contributions.md` documenting evidence-based roles and PRs.                                                                            |
| **8. Peer Evaluation Completion**  | Team  | • Verify both members have submitted the instructor-provided survey.                                                                                                 |
