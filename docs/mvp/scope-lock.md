# MVP Scope Lock: Sentinel Dashboard

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)
**Date:** February 26, 2026

## 1. MVP User Stories

- **Story 1 (Done):** As an Admin, I want to upload a compliance policy text file so that the system can generate a live checklist for the agent.
- **Story 2 (In Progress):** As a Call Center Agent, I want to see my microphone audio transcribed in real-time so that I can verify the system is capturing the conversation.
- **Story 3 (In Progress):** As a Call Center Agent, I want the system to automatically check off items on my compliance list as I say them so that I can focus on the caller instead of manual data entry.
- **Story 4 (Planned):** As a Security Analyst, I want to see a live "Stress Graph" of the caller's voice so that I can identify potential social engineering or aggression immediately.
- **Story 5 (Planned):** As a Supervisor, I want to see a final "Composite Threat Score" at the end of a call so that I can quickly audit which calls require a high-priority review.
**Date:** February 18, 2026

## 1. MVP User Stories

- **Story 1:** As an Admin, I want to upload a compliance policy text file so that the system can generate a live checklist for the agent.
- **Story 2:** As a Call Center Agent, I want to see my microphone audio transcribed in real-time so that I can verify the system is capturing the conversation.
- **Story 3:** As a Call Center Agent, I want the system to automatically check off items on my compliance list as I say them so that I can focus on the caller instead of manual data entry.
- **Story 4:** As a Security Analyst, I want to see a live "Stress Graph" of the caller's voice so that I can identify potential social engineering or aggression immediately.
- **Story 5:** As a Supervisor, I want to see a final "Composite Threat Score" at the end of a call so that I can quickly audit which calls require a high-priority review.

## 2. Explicit Non-Goals

- **No Telephony/SIP Integration:** We will not connect to real phone lines; all audio is captured via the browser microphone.
- **No Multi-Tenant Authentication:** The MVP will be a single-user local deployment with no "Sign Up" or "Login" flow.
- **No Persistent Database:** We will not build a long-term storage solution for transcripts; data will exist only for the duration of the active session.

## 3. Demo Script Outline (Current Capabilities)

1.  **Policy Ingestion (Live):** Use a `curl` command or Postman to upload a raw text policy to `/api/policies`.
2.  **Checklist Verification (Live):** Observe the API response confirming the text has been parsed into indexed checklist items.
3.  **Session Anchor (Live):** Create a monitoring session linked to that specific policy ID via `/api/sessions`.
4.  **Real-time Transcription (Target):** *Functionality currently in development for midterm delivery.*
## 3. Demo Script Outline (Midterm Path)

1.  **Preparation:** Admin uploads a "Security Verification Protocol" document.
2.  **Initialization:** The Agent hits "Start Monitoring" and begins speaking.
3.  **Active Monitoring:** As the Agent says "Thank you for calling," the first checklist item turns green.
4.  **Threat Detection:** A pre-recorded audio clip of an aggressive caller is played; the dashboard shows the "Stress Graph" spiking into the red zone.
5.  **Conclusion:** The call ends, and the system displays a "High Risk" Threat Score based on the caller's aggression.

## 4. Risks & Mitigation Plan

| Risk / Blocker                                                    | Mitigation Plan                                                                                      |
| :---------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| **API Latency:** Real-time transcription might lag by 5+ seconds. | Use a "Stream" approach where text updates incrementally rather than waiting for full sentences.     |
| **Accuracy Errors:** The AI might miss a compliance keyword.      | We will implement "fuzzy matching" so the system recognizes intents even if wording varies slightly. |
| **Microphone Compatibility:** Browser permissions can be finicky. | We will standardize on Chrome and provide a "Troubleshooting" section in the README.                 |

---

**Rule:** If it is not in this scope lock, it shall not consume sprint time this week.
