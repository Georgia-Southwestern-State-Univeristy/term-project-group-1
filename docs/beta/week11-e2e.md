# Deliverable B: End-to-End Workflow Proof

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)  
**Date:** March 26, 2026

---

## 1. Primary Workflow: "Secured Threat-Assisted Call Lifecycle"

This workflow demonstrates the core **"Sentinel"** value proposition: a secure, multi-stage process where an agent conducts a monitored call that results in persistent, audited threat data.

### Step-by-Step Execution

1. **Authentication**  
   The user authenticates via the secure `/login` portal using JWT-based session tokens.

2. **Configuration**  
   The user selects a specific security policy from the dashboard, which loads the corresponding keyword weights and compliance checklists.

3. **Live Ingestion**  
   A transcription session is initiated; real-time PCM audio is streamed to the backend and processed for both text and frequency-based stress indicators.

4. **Real-time Analysis**  
   The Composite Threat Score engine dynamically calculates a risk percentage based on vocal frequency stress, keyword hits, and checklist progress.

5. **Termination & Persistence**  
   Upon ending the call, the system closes the WebSocket and migrates all in-memory transcript and score data to the PostgreSQL database.

6. **Audit Retrieval**  
   The user navigates to the `/history` view to verify that the session, final score, and full transcript are retrieved correctly from the persistent store.

---

## 2. Workflow Documentation

### Entry Point and User Role

- **Entry Point:** The `/login` page followed by the `/dashboard`
- **User Role:** Agent (Standard User)

**Note:** While Supervisors can view history, the Agent is the primary actor for the live call workflow.

---

### Major System Components Involved

- **Authentication Layer:** JWT management via `jose` and `NextAuth` to secure session state
- **Transcription Engine:** AssemblyAI integration for real-time speech-to-text conversion
- **Acoustic Signal Pipeline:** 2048-point FFT analysis for dominant frequency (Hz) extraction
- **Composite Threat Scoring Engine:** Weighted logic combining textual and vocal signals
- **Persistence Layer:** Prisma ORM and PostgreSQL database for durable session archiving

---

### Expected Output / System State at Completion

- **Database State:**  
  A new record exists in the `Sessions` table with a status of `archived` or `completed`

- **Data Integrity:**  
  The final record contains:
  - `transcript_text`
  - `composite_threat_score`
  - `ownerId` matching the authenticated agent

- **User UI:**  
  The dashboard clears the live buffer and displays a success notification with a link to the call’s audit record in the `/history` view
