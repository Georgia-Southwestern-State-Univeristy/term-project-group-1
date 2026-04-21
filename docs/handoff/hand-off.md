# Sentinel: Final Hand-Off Document

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)  
**Status:** Near-Final (Week 15)

---

## 1. System Overview

Sentinel is a real-time AI-powered security co-pilot designed to assist call center agents. It analyzes vocal stress frequencies and textual keywords to generate a live Composite Threat Score, ensuring protocol compliance and early detection of high-risk interactions during live calls.

---

## 2. Architecture Snapshot

Sentinel is built as a **Next.js monolith (App Router)**.

- **Frontend:** React 19 components handle real-time audio capture via the Web Audio API and stream directly to AssemblyAI via WebSockets.
- **Backend:** Next.js route handlers manage session lifecycles, ingest transcript events, and compute threat scores on-the-fly.
- **Persistence:** A PostgreSQL database managed by Prisma ORM stores users, policies, sessions, and full transcript archives.

---

## 3. Stack Rationale

- **Next.js:** Chosen for its unified full-stack architecture, allowing for fast development of both the UI and the API in a single deployable unit.
- **AssemblyAI:** Integrated for high-accuracy, low-latency real-time transcription via a browser-direct WebSocket connection.
- **Prisma & PostgreSQL:** Provides a type-safe data layer with robust relational persistence for historical auditing.

---

## 4. Deployment & Setup Summary

### Prerequisites

- Node.js 22+
- PostgreSQL 15+
- AssemblyAI API Key

### Setup Steps

1. **Environment:** Copy `.env.example` to `.env` and provide `DATABASE_URL` and `ASSEMBLYAI_API_KEY`.
2. **Install:** Run `npm install`.
3. **Database:**
   - `npx prisma migrate deploy` (initializes schema)
   - `npx prisma db seed` (creates demo users)
4. **Run:** `npm run dev` (starts the server on port 3000)

---

## 5. Known Issues & Constraints

- **Browser Support:** Audio capture is restricted to Chromium-based engines (Chrome/Edge) due to specific AudioWorklet requirements; Firefox is supported.
- **Auth Hardening:** Server-side token revocation is currently deferred; logouts clear client state but do not invalidate the JWT server-side.
- **Performance:** The `/call` page utilizes HTTP polling every 2 seconds rather than a server-push channel (SSE/WebSocket), which may impact scaling under high load.

---

## 6. Recommended Next Steps

- **Integrate MFA:** Transition to a third-party auth provider (e.g., Clerk) for enterprise-grade security.
- **Scale Pagination:** Implement server-side pagination for the `/history` view to handle large production datasets.
- **Advanced Analytics:** Build a dedicated Supervisor dashboard for aggregate team-level compliance trends.

---

## 7. Guidance References

- [User Guide: ](./user-guide.md) Detailed walkthrough for Agents and Supervisors.
- [Admin Guide: ](./admin-guide.md) Instructions for diagnostics, health checks, and state recovery.
