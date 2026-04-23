# Deliverable E: Final Technical Defense Snapshot

**File Path:** `/docs/final/final-defense.md`

---

## 1. Why did your team choose this architecture and stack?

The team chose a Next.js Monolith (App Router) to maximize delivery speed and ensure consistent session semantics. By combining the frontend UI and backend API into a single deployable, we reduced the infrastructure overhead that would have been required for the originally proposed multi-container orchestration model.

We chose Prisma and PostgreSQL for type-safe relational persistence and AssemblyAI for its low-latency, browser-direct WebSocket streaming.

---

## 2. What were the most important technical trade-offs?

**Rule-Based vs. LLM Analysis:**  
We prioritized deterministic, zero-latency feedback over semantic nuance by using a rule-based Composite Threat Score calculated via:

$$
\text{Score} = (0.35 \times \text{Stress}) + (0.35 \times \text{Compliance}) + (0.30 \times \text{Keywords})
$$

**Monolith vs. Microservices:**  
We accepted the coupling of UI and API to allow a two-person team to manage a single deployment pipeline instead of maintaining separate backend and orchestrator containers.

**Browser-Direct STT:**  
We bypassed the backend for raw audio streaming to minimize "double-hop" latency. While this means the backend does not see raw audio, it ensures the UI remains responsive.

---

## 3. What is the system’s biggest current weakness?

The system's primary weakness is the monolithic frontend components. The `/call` and `/demo` pages have grown into large single-file components (390+ lines) that mix audio capture logic, API polling, and UI rendering. This makes the frontend difficult to test in isolation and increases the risk of regression during UI updates.

---

## 4. What testing and CI evidence gives you confidence in the release?

**Test Suite:**  
A regression suite of 100+ Jest tests covers all critical business logic, repository layers, and API route handlers.

**Automated Quality Gates:**  
Our GitHub Actions pipeline enforces linting, formatting, type-checking, and full test execution on every Pull Request.

**Observability:**  
The `/api/health` diagnostic endpoint and structured `durationMs` logging allow us to verify system health and identify performance bottlenecks in real-time.

---

## 5. If another team inherited this project, what should they tackle first?

The first priority should be **Auth Hardening (Server-side Token Revocation)**. Currently, the system relies on client-side state clearing for logouts. Implementing a server-side blacklist or a dedicated session store is necessary to ensure that JWTs can be explicitly invalidated before they expire, satisfying enterprise-grade security standards.
