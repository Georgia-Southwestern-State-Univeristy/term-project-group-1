# Deliverable C: Bug Triage + Regression Protection

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)
**Date:** March 12, 2026

---

# 1. Logged Issues (Beta Sprint 1)

---

## Issue 1: In-Memory Data Loss on Server Restart

**Severity:** Critical

**Repro Steps:**

- Create a policy and session in the /demo UI.
- Stop the local dev server using Ctrl+C.
- Restart the dev server using npm run dev.

**Expected:**
Previously created policies and active sessions should be persistent and accessible.

**Actual:**
All data is wiped because the application currently utilizes globalThis in-memory storage.

---

## Issue 2: Real-time Audio Capture Failure in Firefox

**Severity:** Major

**Repro Steps:**

- Access the dashboard using the Mozilla Firefox browser.
- Attempt to "Start" a transcription session.

**Expected:**
The browser should initialize the AudioWorklet and begin streaming audio.

**Actual:**
Audio capture fails due to lack of optimization for non-Chromium AudioWorklet implementations.

---

## Issue 3: Performance Decay via Unbounded Transcript Accumulation

**Severity:** Major

**Repro Steps:**

- Initiate a live transcription session.
- Maintain a continuous audio stream for more than 20 minutes.

**Expected:**
System memory consumption should remain stable throughout the session duration.

**Actual:**
The fullText variable grows indefinitely, leading to increased memory overhead and UI lag.

---

## Issue 4: WebSocket Silent Failure (Missing API Key)

**Severity:** Major

**Repro Steps:**

- Clear or provide an invalid ASSEMBLYAI_API_KEY in the .env.local file.
- Click "Start" to begin streaming.

**Expected:**
The UI should display a "Token request failed" or "Authentication Error" notification.

**Actual:**
The WebSocket closes immediately with no visual feedback, leaving the user on a "Listening..." state.

---

## Issue 5: Application Crash on Port 3000 Conflict

**Severity:** Major

**Repro Steps:**

- Ensure another process is already utilizing Port 3000.
- Execute npm run dev in the project terminal.

**Expected:**
The application should gracefully notify the user of the conflict or attempt to use an alternate port.

**Actual:**
The process terminates with a "Port 3000 is in use" error, requiring a manual npx kill-port to resolve.

---

## Issue 6: UI Stale State (Checklist Persistence)

**Severity:** Minor

**Repro Steps:**

- Complete a transcription session where checklist items are marked as checked.
- Start a new session without performing a manual browser refresh.

**Expected:**
The checklist and transcript display should clear for the new session.

**Actual:**
Previous checkmarks and transcript data persist in the UI due to stale in-memory state.

---

# 2. Fix Tracking & Regression Protection

| Issue # | Fix PR | Description of Fix                                                                 | Regression Test Added?             |
| ------- | ------ | ---------------------------------------------------------------------------------- | ---------------------------------- |
| 3       | #32    | Implemented character and turn-based windowing to prune transcript memory.         | Yes (transcript-windowing.test.ts) |
| 4       | #33    | Added structured JSON logging to identify and trace AssemblyAI API/Token failures. | Yes (structured-logging.test.ts)   |

---
