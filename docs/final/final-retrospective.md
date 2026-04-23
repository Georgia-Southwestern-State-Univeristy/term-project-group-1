# Deliverable F: Final Team Retrospective

**File Path:** `/docs/final/final-retrospective.md`  
**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)

---

## 1. How the Project Improved from Proposal to Final Release

The final Sentinel system is a significantly leaner and more performant architecture than the Week 4 proposal.

**Architectural Consolidation:**  
We originally planned a three-container system featuring a separate "Analysis Orchestrator" and "Backend API". By Week 13, we pivoted to a Next.js monolith, which eliminated the latency overhead of "double-hop" audio data and allowed for a unified state management model.

**Rule-Based Reliability:**  
We moved away from the "eventual consistency" of third-party LLM interpretation. Instead, we implemented a deterministic Composite Threat Score calculated via:

$$
\text{Score} = (0.35 \times \text{Stress}) + (0.35 \times \text{Compliance}) + (0.30 \times \text{Keywords})
$$

This ensured 100% predictable feedback for the user during high-stakes calls.

---

## 2. Most Costly Mistake or Rework Point: "The In-Memory Myth"

Our most significant rework point was the Documentation Drift identified in Week 14.

**The Root Cause:**  
Early in the project, we leaned on in-memory stubs for rapid UI development, but the `README.md` was never updated as we transitioned to a persistent PostgreSQL layer.

**The Cost:**  
This led to a complete overhaul of the deployment guides in Week 15. We spent engineering hours rewriting the User/Admin guides and canonicalizing the `.env` configuration because the previous instructions were non-functional for a reviewer on a clean clone.

---

## 3. Most Valuable Engineering Practice: Unified Zod Validation

The adoption of Zod-based Unified Validation was the project's most impactful quality gate.

**The Outcome:**  
By extracting a shared `parseRequestBody()` utility, we deleted over 80 lines of duplicate, inconsistent validation logic across 13 endpoints.

**The Evidence:**  
This practice directly supported our growth to 100+ automated tests, as we could reliably mock and test error states for malformed frequency bins and transcript events without side effects.

---

## 4. What the Team Did Well: Rapid Technical Pivot

The team excelled at closing the feedback loop once technical risks were ranked.

**Firefox Fallback:**  
After identifying Firefox compatibility as a "Critical" risk, Ivan engineered a WebAudio/AudioWorklet fallback within a single sprint, ensuring the project met cross-browser accessibility standards.

**Observability:**  
We successfully implemented an unauthenticated `/api/health` diagnostic and `durationMs` logging, which gave us the data needed to defend our 2-second polling interval as a sustainable trade-off for a prototype.

---

## 5. What We Would Change Earlier Next Time

**Component Decomposition:**  
We allowed the `/call` page to grow into a monolithic React component (390+ lines) mixing audio capture, polling logic, and UI rendering. We should have enforced a 150-line limit earlier to improve testability.

**Early Migration Strategy:**  
We should have committed the Prisma migrations folder in Week 8. Deferring this meant that clean checkouts required an interactive `migrate dev` command, which complicated the "Happy Path" for external evaluators.
