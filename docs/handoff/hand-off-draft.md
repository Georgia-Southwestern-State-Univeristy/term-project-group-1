# Deliverable F: Initial Hand-Off Draft

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)
**Date:** April 7, 2026

---

## 1. System Overview

Sentinel is a real-time AI-powered security co-pilot. It assists call center agents by analyzing vocal stress frequencies and textual keywords to generate a live **Composite Threat Score**, ensuring compliance and early detection of high-risk interactions.

---

## 2. Stack & Tool Choices

- **Framework:** Next.js (App Router) for a unified full-stack architecture.
- **AI/ML:** AssemblyAI for real-time WebSocket transcription.
- **Database:** PostgreSQL with Prisma ORM for type-safe persistence.
- **Security:** JWT-based authentication with role-based access control (Agent/Supervisor).

---

## 3. Setup & Run Summary

### Environment Variables

- `DATABASE_URL`
- `ASSEMBLYAI_API_KEY`

### Installation

    npm install
    npx prisma migrate dev

### Run the App

    npm run dev

App will automatically use an available port between **3000–3003**.

---

## 4. Known Weaknesses & Technical Debt
- **Browser Lock-in:** Audio capture is currently restricted to Chromium-based engines (Chrome/Edge) due to specific `AudioWorklet` implementation.
- **Auth Hardening:** Server-side token revocation (deny-listing) is currently deferred; logouts clear client-side state but do not invalidate the JWT server-side.
- **Dashboard Bloat:** The `/call` page is a monolithic component (392 lines) that requires decomposition into sub-modules for improved testability.

---

## 5. Recommended Next Steps

- **Integrate MFA:**  
  Move from basic JWT authentication to a multi-factor solution (e.g., OAuth or Clerk) for stronger security.

- **Advanced Analytics:**  
  Build a supervisor dashboard to visualize team-level threat trends and organization-wide compliance metrics.

---
