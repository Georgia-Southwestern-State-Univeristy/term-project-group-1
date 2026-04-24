# Sentinel: Final Hand-Off Document

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)  
**Status:** Final (v1.0)

---

## 1. System Overview

Sentinel is a real-time AI-powered security co-pilot designed to assist call center agents. It analyzes vocal stress frequencies and textual keywords to generate a live **Composite Threat Score**, ensuring protocol compliance and early detection of high-risk interactions during live calls.

---

## 2. Architecture Snapshot

Sentinel is built as a **Next.js monolith (App Router)**.

- **Frontend:** React 19 components handle real-time audio capture via the Web Audio API and stream directly to AssemblyAI via WebSockets with an exponential backoff resilience layer.
- **Backend:** Next.js route handlers manage session lifecycles, ingest transcript events, and compute threat scores deterministically.
- **Persistence:** A PostgreSQL database managed by Prisma ORM stores users, policies, sessions, and a JTI-based token denylist.

---

## 3. Tech Stack and Rationale

- **Next.js:** Chosen for its unified full-stack architecture, allowing for rapid development and deployment of both the UI and the API as a single unit.
- **AssemblyAI:** Integrated for high-accuracy, low-latency real-time transcription via browser-direct WebSocket connections, minimizing server-side overhead.
- **Prisma & PostgreSQL:** Provides a type-safe relational data layer essential for historical auditing and complex session relationships.

---

## 4. Setup / Deployment Summary

### Prerequisites

- Node.js 22+
- PostgreSQL 15+
- AssemblyAI API Key

### Setup Steps

1.  **Environment:** Copy `.env.example` to `.env` and provide `DATABASE_URL` and `ASSEMBLYAI_API_KEY`.
2.  **Install:** Run `npm install`.
3.  **Database Provisioning:**
    - `npx prisma migrate deploy` (Applies schema without interactive prompts).
    - `npx prisma db seed` (Creates the default `agent@sentinel.local` user).
4.  **Run:** `npm run dev` to start the server on port 3000.

---

## 5. Known Issues and Constraints

- **Performance Scaling:** The `/call` page utilizes HTTP polling every 2 seconds for state updates rather than a dedicated server-push channel (SSE/WebSocket), which may impact scaling under high concurrent load.
- **Browser Support:** Optimized for Chromium (Chrome/Edge) and Gecko (Firefox) engines. Safari remains untested and may exhibit AudioWorklet compatibility issues.
- **State Reset:** While WebSocket resilience is implemented, a hard browser refresh during a live call will require the agent to manually resume the session from the dashboard.

---

## 6. Maintenance Notes

- **API Key Rotation:** If the `ASSEMBLYAI_API_KEY` is rotated, the new key must be updated in the `.env` file and the server restarted.
- **Token Denylist Management:** The `revoked_tokens` table in PostgreSQL stores JTIs to prevent session reuse. To prevent database bloat, the `expiresAt` column should be used to prune expired tokens.
- **Schema Evolution:** New database changes must be applied via `npx prisma migrate dev` during development to ensure the Prisma Client remains synchronized with the PostgreSQL types.

---

## 7. Recommended Next Steps

- **Implement Cron Job:** Automate the pruning of the `revoked_tokens` table to ensure database performance.
- **Component Refactoring:** Decompose the monolithic `/call` and `/demo` pages (currently 350+ lines) into smaller, testable UI components.
- **Integrate MFA:** Transition the current JWT implementation to a third-party provider (e.g., Clerk or Auth0) to support Multi-Factor Authentication.
- **Scale Pagination:** Add server-side pagination to the `/history` view to handle datasets exceeding 1,000 sessions.

---

## 8. User/Admin Guidance References

- **[User Guide](./user-guide.md):** Detailed walkthrough for Agents and Supervisors.
- **[Admin Guide](./admin-guide.md):** Instructions for system diagnostics, health checks (`/api/health`), and state recovery.
- **[Final Defense](../final/final-defense.md):** Strategic justification for architectural decisions and trade-offs.
