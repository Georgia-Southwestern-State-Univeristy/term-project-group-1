# Midterm Technical Snapshot: Sentinel Dashboard

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)
**Version:** 1.0.0-midterm

---

## 1. Architecture Recap

The system is built on a modern Next.js 22 App Router architecture, utilizing an orchestration layer to manage live call sessions.

- **Frontend:** A responsive Next.js UI for agents to monitor transcripts and checklist compliance.
- **Backend API:** A Next.js API layer managing policy ingestion, session state, and transcription events.
- **External Integrations:** Real-time audio streaming and transcription provided via WebSockets/AudioWorklet integration with the AssemblyAI API.
- **Data Store:** In-memory repositories are utilized for the prototype phase to manage policies, sessions, and transcripts.

**Reference:** [C4 Container Diagram Link](/docs/architecture/first-pass-architecture.md)

---

## 2. What's Implemented (MVP)

The midterm build fulfills the core "compliance monitoring" mission with the following 5–10 key features:

- **Policy Ingestion Engine:** `POST /api/policies` accepts raw text and parses it into discrete checklist items.
- **Session Orchestration:** `POST /api/sessions` anchors live monitoring to specific compliance policies.
- **Real-Time PCM Processing:** Custom `pcm-processor.js` AudioWorklet for low-latency browser audio capture.
- **WebSocket Streaming:** Bidirectional communication with AssemblyAI for incremental transcript updates.
- **Fuzzy Matching Logic:** Normalization engine that matches spoken intent to policy items regardless of casing or punctuation.
- **Secure Token Minting:** `/api/assemblyai/token` provides temporary credentials to keep API keys server-side.

---

## 3. What's Missing (Beta Scope)

The following features are reserved for the Week 9–12 Beta development cycle:

- **Acoustic Sentiment Analysis:** Real-time pitch/intensity monitoring (Stress Graph).
- **Post-Call Auditing:** Composite threat score logic and session ending summaries.
- **Data Persistence:** Migration from in-memory maps to a persistent database (e.g., PostgreSQL).
- **Multi-Tenant Auth:** Transition from local single-user deployment to a full authentication flow.

---

## 4. System Run Instructions

Detailed environment setup and execution steps are maintained in the main project documentation.

- **Documentation Link:** [README Section: Getting Started](/README.md#getting-started)

---

## 5. Test & CI Status

The project maintains high reliability through a comprehensive automated pipeline.

- **Test Coverage:** Includes service-level integration tests (`policyUploadFlow.test.ts`) and real-time logic tests (`realTimeAutocheck.test.ts`).
- **CI Pipeline:** Every Pull Request to `main` triggers a GitHub Action that enforces:
  - **Linting:** `eslint` checks.
  - **Code Formatting:** `prettier` style enforcement.
  - **Type Safety:** `tsc --noEmit` checks.
  - **Unit/Integration Tests:** `jest` suite execution.
  - **Production Build:** `next build` verification.
