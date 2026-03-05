# MVP Completion Checklist: Sentinel Dashboard

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)
**Date:** March 3, 2026

---

## 1. MVP User Story Status

| Story       | Description                                 | Status       |
| :---------- | :------------------------------------------ | :----------- |
| **Story 1** | Admin policy upload & checklist generation. | **Done**     |
| **Story 2** | Real-time microphone transcription UI.      | **Done**     |
| **Story 3** | Auto-checklist via fuzzy matching.          | **Done**     |
| **Story 4** | Live "Stress Graph" for sentiment analysis. | **Not Done** |
| **Story 5** | Composite Threat Score audit.               | **Not Done** |

---

## 2. Acceptance Criteria Notes

- **Story 1 (Policy Upload):** System successfully parses multi-line raw text into distinct `ChecklistItem` objects with unique IDs via the `POST /api/policies` route.
- **Story 2 (Transcription):** Frontend utilizes `AudioWorklet` for PCM capture and secure token minting to stream live audio to AssemblyAI.
- **Story 3 (Auto-Checklist):** Backend `checklistService` employs normalization (lowercase, punctuation stripping) to match spoken intent against policy requirements.

---

## 3. Top 3 Risks Heading into Beta

1.  **Memory Management (The "Reality Check"):** Current `fullText` accumulation joins all final transcripts in memory. While efficient for short calls, 30+ minute sessions may require a windowed or vector-store approach to prevent performance degradation.
2.  **API Reliability:** The real-time flow is dependent on third-party WebSocket stability. If the AssemblyAI token expires or the connection drops, the checklist currently requires a session restart.
3.  **Complexity of Story 4:** Implementing the "Stress Graph" requires extracting acoustic features (pitch/jitter) from raw PCM data, which is significantly more complex than text-based matching.
