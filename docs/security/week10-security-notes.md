# Week 10: Security Risks & Validation Strategy

---

## 1. Identified Concrete Risks

### Risk 1: Client-Side AssemblyAI Key Exposure

- **Description:** If the AssemblyAI token generation or Master Key is handled in the frontend, an attacker can extract it and abuse billing usage.
- **Sentinel Specifics:**  
  WebSocket token generation must occur server-side via `/api/auth/speech-token`, keeping the Master Key secured in `.env.local`.

---

### Risk 2: Unauthenticated Transcription Spoofing (IDOR)

- **Description:**  
  An attacker could POST fake transcript data to `/api/sessions/[id]/transcript-events`. Without ownership checks, they could inject false stress alerts into another agent’s dashboard.
- **Sentinel Specifics:**  
  The API must verify that the `sessionId` belongs to the `userId` making the request before processing.

---

### Risk 3: Denial of Service (DoS) via Unbounded Audio Buffers

- **Description:**  
  Attackers could flood the transcription endpoint with large PCM audio chunks, exhausting server memory.
- **Sentinel Specifics:**
  - Enforce a strict **5MB payload limit** on audio ingestion
  - Apply **rate limiting** on WebSocket connections

---

## 2. Evidence of Security Fixes

We addressed **Risk 1** and **Risk 2** in this sprint.

| Risk Fixed          | PR Number | Before Behavior                                                          | After Behavior                                                                      |
| ------------------- | --------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| **Key Exposure**    | [PR #XX]  | Master API Key visible in browser Network tab during WebSocket handshake | Master Key stays server-side; browser receives short-lived, low-privilege JWT token |
| **Spoofing (IDOR)** | [PR #XX]  | Any valid UUID could POST transcript data to any session                 | Server returns `403 Forbidden` if `ownerId` ≠ requester `userId`                    |

---

## 3. Input Validation Implementation

We used **Zod** to harden key input points:

---

### A. Policy Upload Form

- **Validation Logic:**  
  Rejects policy JSON missing `required_keywords` or containing empty `checklist_items`.

- **Before:**  
  Empty arrays caused divide-by-zero errors, crashing the UI.

- **After:**  
  UI shows error:  
  `"Validation Error: Policy must contain at least 1 checklist item"`

---

### B. Session Initialization

- **Validation Logic:**  
  Ensures `policyId` is a properly formatted UUID before database lookup.

- **Before:**  
  Invalid input exposed raw PostgreSQL errors to the client.

- **After:**  
  API returns clean error:
  ```json
  { "error": "Invalid Policy ID format" }
  ```
  with a 400 Bad Request status.
