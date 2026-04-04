# Beta Retrospective & Final Sprint Plan

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)  
**Date:** April 3, 2026

---

## 1. Beta Retrospective

### What Went Well

- **Architectural Pivot:**  
  The transition from a volatile `globalThis` in-memory store to a persistent PostgreSQL layer via Prisma was completed without breaking existing API contracts.

- **Security-First Implementation:**  
  Successfully implemented JWT-based authentication and server-side RBAC enforcement, which received positive feedback for engineering maturity.

- **Testing Discipline:**  
  The team scaled the test suite from basic unit tests to **82 automated tests** covering full-lifecycle workflows and failure paths.

- **Signal Processing Accuracy:**  
  The Composite Threat Score successfully integrates disparate data streams (vocal frequency and text) into a single, actionable metric.

---

### What Slowed the Team Down

- **AudioWorklet Fragmentation:**  
  Significant development time was lost attempting to troubleshoot Firefox-specific audio capture failures, which remains the primary technical hurdle.

- **Late-Stage Persistence Migration:**  
  Starting with in-memory storage delayed the development of historical auditing and resulted in a heavy refactor in Week 10.

- **State Management Logic:**  
  Managing the real-time "checklist" state across multiple components led to intermittent UI stale-state issues that required multiple logic overrides.

---

### Top 3 Lessons Learned

1. **Persistence is a Day-One Requirement**  
   Relying on in-memory storage—even for a prototype—creates technical debt that complicates core features like Auth and History.

2. **API Enforcement > UI Guardrails**  
   Prioritizing server-side ownership checks (403 errors) provided a more robust security posture than simply hiding UI elements.

3. **Automated Refactor Protection**  
   Having a 50+ test suite enabled a full database migration in a single sprint without introducing critical regressions.

---

## 2. Final Sprint Plan (Weeks 13–15)

The final weeks will focus on **Cross-Browser Stability** and **Audit Scalability**.

### Top 5 Priorities

1. **Cross-Browser Polyfill**  
   Implement a MediaRecorder or WebAudio fallback to resolve the high-priority Firefox audio capture failure.

2. **Resilient Streaming**  
   Integrate exponential backoff and heartbeat logic for WebSocket auto-reconnection.

3. **Advanced Audit Search**  
   Implement PostgreSQL full-text search to allow supervisors to query archived transcripts.

4. **UI/UX Polish**  
   Resolve the stale state issue in the dashboard and standardize "Loading" and "Error" feedback across all views.

5. **Final Documentation**  
   Complete the Technical OpenAPI Spec and the Final User Manual for production hand-off.
