# Beta Sprint Plan: Sentinel Dashboard

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)
**Project Phase:** Beta Transition (Weeks 9–12)

---

## 1. Top 8–12 Backlog Items (Ranked)

These items represent the path from our Midterm MVP to a feature-complete Beta release:

1.  **Acoustic Signal Processing:** Implement fundamental frequency (pitch) extraction from raw PCM buffers.
2.  **Stress Graph UI:** Develop a real-time D3.js or Chart.js component to visualize voice intensity.
3.  **Database Migration:** Replace in-memory `globalThis` repositories with a persistent PostgreSQL instance.
4.  **Scoring Logic Engine:** Develop the weighted algorithm for the "Composite Threat Score".
5.  **Post-Call Audit Dashboard:** Create a supervisor-facing UI to review ended session histories.
6.  **Transcription Optimization:** Implement a rolling window for `fullText` to prevent memory bloat on long calls.
7.  **Auto-Reconnect Logic:** Add WebSocket recovery for intermittent AssemblyAI connection drops.
8.  **Session Archiving:** Enable logic to save and retrieve historical transcript data from the database.
9.  **Multi-Tenant Preparation:** Implement basic environment-based configuration for future auth integration.
10. **UI Hardening:** Standardize error handling and "Loading" states across the dashboard.

---

## 2. Sprint Schedule

### **Sprint 4: Acoustic Analysis (Week 9–10)**

- **Primary Goal:** Deliver Story 4 (Stress Graph) functionality.
- **Quality Sprint Item:** **Reliability.** Implement the database migration to ensure session state survives server restarts.

### **Sprint 5: Analytics & Auditing (Week 11)**

- **Primary Goal:** Deliver Story 5 (Composite Threat Score) and Supervisor views.
- **Quality Sprint Item:** **Performance.** Optimize the transcription buffer to maintain UI responsiveness during high-load analysis.

### **Sprint 6: Hardening (Week 12)**

- **Primary Goal:** Zero-bug bounce and final feature polish.
- **Quality Sprint Item:** **Documentation.** Complete the Final User Manual and refine the OpenAPI technical specification.

---

## 3. Risk Identification & Mitigation

**Riskiest Technical Item:** **Acoustic Feature Extraction (Story 4)**.

- **The Problem:** Extracting pitch (Hz) and jitter/shimmer from real-time PCM data in a browser environment is mathematically complex compared to text-based matching.
- **Mitigation Strategy:** Scheduled for the start of Sprint 4 (Week 9) to provide maximum "runway" for troubleshooting and signal-processing adjustments.
