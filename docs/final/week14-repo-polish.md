# Week 14: Documentation Alignment & Repo Polish

---

## 1. Documentation Alignment Matrix

We have performed a top-to-bottom audit to ensure the "Technical Story" is consistent across all entry points.

| Document       | Alignment Action Taken                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| README.md      | Removed all "in-memory" references; synchronized setup with PostgreSQL/Prisma; added Reviewer Start Path.            |
| Deploy Guide   | Renamed to `deploy.md`; updated setup to use `prisma migrate dev`; synced test count to 92.                          |
| Architecture   | Finalized Week 13 Snapshot as the "Current Truth," documenting the pivot away from a separate Analysis Orchestrator. |
| Hand-Off Draft | Synchronized "Known Weaknesses" with the Week 14 Triage list to include auth hardening and component bloat.          |

---

## 2. Renovations & Cleanup

- **Pruned Stale Files**  
  Deleted outdated Week 3 "In-Memory" mockup scripts and legacy setup text that mentioned SQLite or global variables.

- **Renamed Artifacts**  
  Renamed "Beta Deployment" to "Deployment & Setup" to reflect transition to a Release Candidate.

- **Unified UI Terminology**  
  Verified that all guides refer to real-time scoring as the **Composite Threat Score**, matching `threatScoreService.ts` implementation.

---
