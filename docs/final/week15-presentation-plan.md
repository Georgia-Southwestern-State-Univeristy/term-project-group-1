# Deliverable C: Presentation Plan & Speaking Roles

**File Path:** `/docs/final/week15-presentation-plan.md`

---

## 1. Presentation Title

**Sentinel: Real-Time AI Co-Pilot for Threat Mitigation and Compliance**

---

## 2. Planned Structure (15 Minutes)

| Time            | Section                     | Speaker | Key Content                                                                                                                                                                                                                             |
| --------------- | --------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0:00–3:30**   | The Vision & Visionary      | Jaxon   | • Intro: The gap in cybersecurity awareness training.<br>• Vision: How Sentinel empowers the call center ecosystem.<br>• Tech Landscape: Overview of the "Modern Monolith" (Next.js/Postgres).                                          |
| **3:30–11:30**  | Live System Demo            | Ivan    | • Setup: Verify `/api/health` and login with seed credentials.<br>• The Happy Path: Real-time transcription, stress analysis, and auto-checklist in action.<br>• Persistence: Moving from live session to the Supervisor History audit. |
| **11:30–15:00** | Engineering Defense & Close | Jaxon   | • Quality Control: Reviewing the 100+ tests and Zod validation logic.<br>• Security: Deep dive into the JWT/RBAC model.<br>• Roadmap: Addressing deferred items (pagination/search) and the path to v1.0.                               |

---

## 3. Demo Logistics & Backup Plan

- **Demo Driver:** Ivan will "drive" the live software (mouse/keyboard) while speaking to ensure seamless narration of backend events as they occur.

- **Backup Plan:** In the event of a significant AssemblyAI WebSocket failure or local network outage, the team will pivot to a high-fidelity pre-recorded video of the demo workbench (Phase 2) to ensure the 15-minute window is maintained.

---

## 4. Draft Slide Outline

1. **Title Slide:** Sentinel & Group 1 Roster
2. **The Problem:** Why static security training fails
3. **The Solution:** Live AI-assisted co-pilot for agents
4. **Architecture:** Next.js Monolith + Prisma/PostgreSQL
5. **External Integration:** AssemblyAI Real-time Streaming
6. **Security Model:** JWT Auth & Role-Based Access Control
7. **Quality Gates:** 100+ Automated Tests & Structured Logging
8. **Live Demo Transition:** (Ivan takes over)
9. **Demo Summary:** Highlights of threat scoring and compliance
10. **Triage & Risks:** Addressing Firefox and Auth hardening
11. **Roadmap:** Future scaling and supervisor analytics
12. **Q&A:** Final defense of the work
