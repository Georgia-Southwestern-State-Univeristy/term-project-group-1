# Deliverable A: Week 11 Sprint Goal & Integration Backlog

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)  
**Date:** March 26, 2026

---

## 1. Sprint Goal

By Friday, users can execute a seamless, persistent end-to-end call lifecycle—from secure multi-role login to live threat analysis and historical session auditing—with full browser compatibility and automated WebSocket recovery.

---

## 2. Committed Backlog (Ranked)

### Item 1: Issue #2 – Firefox Audio Capture Compatibility

- **Rank:** 1 (Reliability)
- **Owner:** Ivan

**Acceptance Criteria:**

- AudioWorklet initializes correctly in Mozilla Firefox
- Real-time audio streams to the dashboard without stuttering or silent failure on non-Chromium engines

---

### Item 2: Backlog #5 – Post-Call Audit Dashboard

- **Rank:** 2 (Workflow Completion)
- **Owner:** Jaxon (Docs/UX) / Ivan (Implementation)

**Acceptance Criteria:**

- Create a supervisor-facing UI to review ended session histories
- Dashboard displays the final Composite Threat Score and full transcript for any archived session

---

### Item 3: Backlog #7 – WebSocket Auto-Reconnect Logic

- **Rank:** 3 (Reliability)
- **Owner:** Ivan

**Acceptance Criteria:**

- Implement recovery logic for intermittent AssemblyAI connection drops
- UI displays a "Reconnecting..." status instead of hanging on a stale state during network blips

---

### Item 4: Issue #6 – Dashboard State Reset (UI Stale State)

- **Rank:** 4 (Integration/Workflow)
- **Owner:** Jaxon

**Acceptance Criteria:**

- Checklist and transcript displays clear automatically when a new session begins
- Ensure in-memory state in the React frontend is properly purged upon session termination

---

### Item 5: Backlog #8 – Session Archiving & Retrieval

- **Rank:** 5 (Integration)
- **Owner:** Ivan

**Acceptance Criteria:**

- Enable logic to retrieve historical transcript data from the PostgreSQL database
- Integrated into the `/history` route for both Agent and Supervisor views

---

### Item 6: End-to-End Automated Workflow Tests

- **Rank:** 6 (Testing/Quality)
- **Owner:** Ivan

**Acceptance Criteria:**

- Implement 2 tests tied to the primary login-to-archive workflow
- Implement at least 1 failure-path test (e.g., database timeout handling)
