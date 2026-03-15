# Deliverable A: Week 9 Sprint Goal & Committed Backlog

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)
**Date:** March 12, 2026

---

## 1. Sprint Goal

> "By Friday, agents can visualize real-time voice intensity via a stress graph and all call data will persist in a database rather than local memory."

---

## 2. Committed Backlog (Ranked)

| Rank | Item                       | Owner           | Acceptance Criteria                                                                                                                                                                                                                                |
| ---- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Acoustic Signal Processing | Ivan Herndon    | <ul><li>PCM data is successfully converted into frequency values (Hz) in real-time.</li><li>Data is extracted without causing audio lag or stream drops in the transcription feed.</li></ul>                                                       |
| 2    | Stress Graph UI            | Ivan Herndon    | <ul><li>Graph component renders in the agent dashboard and moves in sync with speaker volume/pitch.</li><li>Graph includes clear visual labels for "Stress Level" or "Intensity".</li></ul>                                                        |
| 3    | Database Migration         | Ivan Herndon    | <ul><li>All session and policy data is successfully written to a PostgreSQL database.</li><li>After a server restart, previously created sessions remain accessible and "Active".</li></ul>                                                        |
| 4    | Transcription Windowing    | Ivan Herndon    | <ul><li>The `fullText` variable is archived or truncated once it reaches a specific character limit to prevent memory bloat.</li><li>The UI continues to display recent context to the agent while background memory usage stays stable.</li></ul> |
| 5    | Bug Hunt & Triage          | Jaxon Doolittle | <ul><li>At least six unique issues are logged in `/docs/beta/bug-triage.md`.</li><li>Each issue includes a severity tag (Critical/Major/Minor) and numbered reproduction steps.</li></ul>                                                          |
| 6    | Structured Logging         | Ivan Herndon    | <ul><li>Logs include a timestamp, event type, and Session ID for correlation.</li><li>Key actions (Session Start, Policy Upload, API Error) are recorded in a standard JSON format.</li></ul>                                                      |
| 7    | Error State UI             | Jaxon Doolittle | <ul><li>A visible alert appears on the dashboard if the AssemblyAI WebSocket fails to connect.</li><li>Clear instructions (e.g., "Allow Microphone Permissions") appear if audio capture is blocked by the browser.</li></ul>                      |

---

## 3. Definition of Done for Sprint 1

- All code is merged into the **main branch** via a Pull Request.
- Every PR has **at least one reviewer approval**.
- **GitHub Actions (CI)** quality checks are passing.
- The issue/card on the **Project Board** is linked to the completing PR.
