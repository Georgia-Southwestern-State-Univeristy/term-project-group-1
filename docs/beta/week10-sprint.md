# Deliverable A: Week 10 Sprint Goal & Committed Backlog

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)  
**Date:** March 20, 2026

---

## 1. Sprint Goal

By Friday, users can securely authenticate into the Sentinel Dashboard, and all call session data will persist reliably in a PostgreSQL database.

---

## 2. Committed Backlog (Ranked, Matched to Issues)

### Item 1: Database Migration (PostgreSQL)

- **Rank:** 1 (Critical Path)
- **Owner:** Ivan
- **GitHub Issue:** #35

**Acceptance Criteria:**

- Replace `globalThis` repositories with persistent Postgres tables.
- Session data must survive a full server restart (`npm run dev`).
- Fixes Issue #1.

---

### Item 2: User Authentication & Role Model + Access Control

- **Rank:** 2 (Security Requirement)
- **Owner:** Jaxon (Docs) / Ivan (Implementation)
- **GitHub Issue:** (New / Not yet created)

**Acceptance Criteria:**

- Implement secure login (session/token based).
- Define User/Admin roles.
- Enforce rule: _Users can only view their own sessions_.
- Unauthorized API access returns `403`.

---

### Item 3: Firefox Audio Capture Support

- **Rank:** 3 (UI Hardening)
- **Owner:** Ivan
- **GitHub Issue:** #36

**Acceptance Criteria:**

- AudioWorklet initializes correctly in Mozilla Firefox.
- Audio streaming functions without breaking.

---

### Item 4: Security Risk Identification, Mitigation & Input Validation

- **Rank:** 4 (Security Requirement)
- **Owner:** Jaxon (Docs) / Ivan (Fixes)
- **GitHub Issue:** (New / Not yet created)

**Acceptance Criteria:**

- Identify 3 implementation-specific risks (e.g., API key exposure).
- Apply fixes for at least 2 risks.
- Add validation (Zod or Regex) to at least 2 input points.
- Return clear error messages for invalid input.

---

### Item 5: Port 3000 Conflict Handling

- **Rank:** 5 (Stability / Dev Experience)
- **Owner:** Ivan
- **GitHub Issue:** #38

**Acceptance Criteria:**

- Detect port conflicts on startup.
- Provide clear error OR auto-switch ports.

---

### Item 6: Story 5: Composite Threat Score Logic

- **Rank:** 6 (Feature)
- **Owner:** Ivan
- **GitHub Issue:** #22

**Acceptance Criteria:**

- Implement weighted scoring algorithm.
- Combine frequency analysis + checklist state.
- Display score in live session UI.

---

### Item 7: Automated Security, Regression Tests & Usability Fixes

- **Rank:** 7 (QA + Polish)
- **Owner:** Ivan
- **GitHub Issue:** (Mixed / Multiple)

**Acceptance Criteria:**

- 4 new tests total:
  - 2 auth enforcement tests
  - 1 validation failure test
  - 1 regression test (Issue #3 memory fix)
- Implement 2 usability improvements based on MVP feedback (e.g., loading states).

---
