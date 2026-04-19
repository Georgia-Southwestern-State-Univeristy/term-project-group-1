## User Guide

**File Path:** `/docs/user-guide.md`

### Who is this for?

- **Agents:** Front-line representatives who conduct live calls and require real-time protocol assistance.
- **Supervisors:** Management personnel responsible for reviewing call quality, compliance adherence, and threat trends.

---

### Main Tasks

- **Conduct Assisted Calls:** Monitor live transcription and real-time threat scores.
- **Verify Compliance:** Track progress against a dynamic checklist tied to specific security policies.
- **Historical Auditing:** Review archived transcripts and final composite threat scores for ended sessions.

---

### Core Workflow: Step-by-Step

1. **Access:**  
   Navigate to the login portal and enter your credentials (e.g., `agent@sentinel.local`).

2. **Configure:**  
   From the Dashboard, select the relevant Security Policy from the dropdown menu to load specific keywords and checklist items.

3. **Engage:**  
   Click **"Start Call"** to begin real-time transcription. As you speak, the Composite Threat Score will fluctuate based on:
   - **Vocal Stress (35%):** Detected frequency anomalies in your audio.
   - **Compliance (35%):** Items checked off your protocol list.
   - **Keywords (30%):** High-risk terms identified in the transcript.

4. **Conclude:**  
   Click **"End Session"** to stop the stream. The system will automatically archive the data to the persistent database.

5. **Audit:**  
   Navigate to the **History** tab to search for and expand your previous sessions for detailed review.

---

### Known Limitations & Constraints

- **Browser Support:**  
  Only Chromium-based browsers (Chrome, Edge) currently support live audio capture.

- **Connectivity:**  
  If the **"Connection Lost"** banner appears, manual session restart is required as auto-reconnection is not yet active.
