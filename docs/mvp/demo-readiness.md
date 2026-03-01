# Demo Readiness Checklist: Call Co-pilot Dashboard

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)
**Date:** February 28, 2026
**Target Demo Timebox:** 5–7 minutes

---

## 1. Prerequisites

| Requirement        | How to verify                                            |
| :----------------- | :------------------------------------------------------- |
| Node.js 22         | `node -v` → `v22.x`                                      |
| npm                | `npm -v`                                                 |
| AssemblyAI API key | `.env.local` contains `ASSEMBLYAI_API_KEY=<real key>`    |
| Working microphone | System Settings → Sound → Input level responds to speech |

Set up the environment variable before the demo:

```bash
cp .env.example .env.local        # creates the file
# Edit .env.local and paste your real AssemblyAI key
```

---

## 2. Step-by-Step Demo Script

This script exercises the full **Policy Upload → Session → Real-Time Transcription → Auto-Checklist** flow through the `/demo` UI.

### Part A — Start the server

1. **Initialize Environment:** Open a terminal in the project root and run `npm run dev` to start the Next.js server on `http://localhost:3000`.
2. **Open the Demo Page:** Navigate to `http://localhost:3000/demo` in Chrome (recommended for AudioWorklet + mic support).

### Part B — Create a policy and session (UI)

3. **Enter a Policy Name:** Type `HIPAA Basic` in the "Policy name" field.
4. **Enter Checklist Items:** Paste the following into the textarea (one item per line):
   ```
   Verify caller identity
   Confirm date of birth
   Read privacy notice
   ```
5. **Click "Create Policy":** The confirmation message should read _"Policy created: HIPAA Basic (3 items)"_.
6. **Click "Create Session":** The confirmation should read _"Session: \<id\> (active)"_. The checklist appears with three unchecked items.

### Part C — Real-time transcription and auto-checklist

7. **Click "Start":** Grant microphone access when the browser prompts. The transcript box should show _"Listening…"_.
8. **Speak the checklist phrases** using this sample script (pause briefly between each):
   > "I need to verify caller identity. Can you please confirm date of birth? Now I will read privacy notice."
9. **Watch the checklist update live:** As AssemblyAI transcribes each phrase and sends it to the backend, matching checklist items flip from `[ ]` to `[x]` with a strikethrough.
10. **Click "Stop":** The session ends, microphone is released, and the final transcript is visible in the text box.

### Part D — Wrap-up

11. **Final Summary:** Explain that the system:
    - Captures audio via an AudioWorklet at 16 kHz, streams PCM over WebSocket to AssemblyAI
    - Receives real-time turn transcripts, posts them to the backend
    - Backend auto-checks checklist items using fuzzy text matching against the full transcript
    - All state is in-memory (no database required for the prototype)

---

## 3. Alternative: curl-Only Demo (no mic needed)

If microphone access is unavailable or the audience prefers a terminal demo, the same flow can be driven entirely via `curl`.

1. **Upload a policy:**
   ```bash
   curl -s -X POST http://localhost:3000/api/policies \
     -H "Content-Type: application/json" \
     -d '{"name":"HIPAA Basic","text":"Verify caller identity\nConfirm date of birth\nRead privacy notice"}' | jq .
   ```
2. **Create a session** (copy the `id` from step 1):
   ```bash
   curl -s -X POST http://localhost:3000/api/sessions \
     -H "Content-Type: application/json" \
     -d '{"policyId":"<POLICY_ID>"}' | jq .
   ```
3. **Send a transcript event** (copy the session `id` from step 2):
   ```bash
   curl -s -X POST http://localhost:3000/api/sessions/<SESSION_ID>/transcript-events \
     -H "Content-Type: application/json" \
     -d '{"events":[{"text":"I need to verify caller identity","isFinal":true,"occurredAt":"2026-02-28T12:00:00Z"}]}' | jq .
   ```
   The response shows `checkedItemIds` containing the matched item.
4. **Check session state:**
   ```bash
   curl -s http://localhost:3000/api/sessions/<SESSION_ID>/state | jq .
   ```
   The `checklistState` array shows the first item checked.
5. **End the session:**
   ```bash
   curl -s -X POST http://localhost:3000/api/sessions/<SESSION_ID>/end | jq .
   ```

---

## 4. Seed Data Plan

To ensure a consistent and repeatable demo, use the following "Golden Data":

| Field               | Value                                                                                                     |
| :------------------ | :-------------------------------------------------------------------------------------------------------- |
| **Policy Name**     | `HIPAA Basic`                                                                                             |
| **Checklist Items** | `Verify caller identity` / `Confirm date of birth` / `Read privacy notice`                                |
| **Sample Speech**   | "I need to verify caller identity. Can you please confirm date of birth? Now I will read privacy notice." |

The auto-check matcher normalizes text (lowercases, strips punctuation, collapses whitespace) so exact wording is not required — close paraphrases will match as long as the core phrase appears in the transcript.

---

## 5. Known Issues & Troubleshooting

| Potential Issue                                                           | Mitigation / Handling                                                                              |
| :------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------- |
| **Port Conflict:** Terminal says port 3000 is in use.                     | Run `npx kill-port 3000` or use `npm run dev -- -p 3001`.                                          |
| **Missing API Key:** "Start" returns _"Token request failed: 500"_.       | Verify `.env.local` contains a valid `ASSEMBLYAI_API_KEY`. Restart the dev server after adding it. |
| **Microphone Denied:** Browser blocks mic access.                         | Click the lock/site-settings icon in the address bar → allow Microphone → reload the page.         |
| **WebSocket Closes Immediately:** Streaming stops within 2 seconds.       | Usually an invalid or expired API key. Generate a new key at assemblyai.com/dashboard.             |
| **Checklist Not Checking:** Items stay unchecked despite matching speech. | Restart the dev server to clear stale in-memory state, then create a fresh policy and session.     |
| **Local Cache Lag:** Data from a previous run persists in memory.         | Restart the dev server (`Ctrl+C` then `npm run dev`) to clear the in-memory repositories.          |
| **Firefox AudioWorklet Issues:** Audio capture may not work.              | Use Chrome or Edge, which have the best AudioWorklet support.                                      |

---

## 6. Fallback Plan (Environment Failure)

If the local environment fails to run during the live presentation:

1. **curl-Only Path:** Fall back to Section 3 above, which exercises the full backend without a microphone or AssemblyAI key.
2. **Screen Recording:** A pre-recorded video of the `/demo` UI flow will be available in the repo at `docs/mvp/demo-fallback.mp4`.
3. **Postman Collection:** A pre-configured Postman collection is shared in the team workspace to execute the same API requests without the terminal.

---

**Expectation:** Another teammate should be able to run this demo from this doc without guessing.
