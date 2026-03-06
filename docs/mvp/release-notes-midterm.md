# Release Notes: Midterm MVP (v1.0.0)

**Release Tag:** `midterm-v1.0.0`

---

## 1. What's Included in the Midterm Build

This release represents the functional "Call Co-pilot" prototype, enabling a complete flow from policy ingestion to real-time compliance monitoring.

- **Policy Ingestion:** API support for parsing raw text into actionable checklists.
- **Live Transcription:** Real-time audio streaming and display via AssemblyAI.
- **Automated Compliance:** Fuzzy matching engine that auto-checks checklist items during a live call.
- **Dashboard UI:** A complete agent-facing dashboard for session management.

---

## 2. Known Issues & Limitations

- **Browser Requirement:** Full audio functionality is optimized for **Chrome** due to AudioWorklet support; Firefox is not currently supported for real-time capture.
- **In-Memory Storage:** All session and policy data is stored in memory (`globalThis`). Restarting the dev server will clear all active data.
- **Transcription Buffer:** Current logic joins all "final" transcripts into a single string, which may lead to memory overhead in very long sessions.

---

## 3. How to Reproduce the Demo Path

To replicate the state shown in the midterm demo, follow these steps:

1.  **Environment Setup:** Ensure an `ASSEMBLYAI_API_KEY` is present in your `.env.local` file.
2.  **Install:** Run `npm install` and `npm run dev` to start the local server.
3.  **Initialize:** Navigate to `http://localhost:3000/demo` in Chrome.
4.  **Execution:** Follow the "Golden Path" script (HIPAA Basic Policy) detailed in `/docs/mvp/demo-readiness.md`.
