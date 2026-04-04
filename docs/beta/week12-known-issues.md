# Known Issues & Triage List

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)  
**Release Tag:** beta-v0.1

---

## 1. Prioritized Issue Triage

| Issue                      | Rank   | Description                                                                                                      | Likely Cause                                                                                        | Planned Next Action                                                                                                 |
| -------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Firefox Audio Capture      | High   | The AudioWorklet fails to initialize on non-Chromium engines, preventing Firefox users from starting live calls. | AudioWorklet implementation differences between Blink (Chrome) and Gecko (Firefox) engines.         | Research and implement a cross-browser audio capture polyfill or a MediaRecorder fallback for the final release.    |
| WebSocket Connectivity     | Medium | Sudden network drops cause the transcription stream to hang without an automatic reconnection attempt.           | Lack of heartbeat/ping logic and exponential backoff in the current client-side WebSocket handler.  | Implement a "reconnect" event listener to restore the session state automatically upon network recovery.            |
| Advanced Historical Search | Medium | Users can view call history but cannot search archived transcripts for specific keywords or stress events.       | Database queries are currently limited to basic metadata filters like ownerId and status.           | Implement PostgreSQL full-text search indexes on the transcript column in the database.                             |
| UI Stale State             | Low    | The checklist UI occasionally retains "checked" states from previous sessions until a manual refresh occurs.     | React state in the dashboard component is not being fully purged when a new session is initialized. | Add an explicit `resetState` function to the session cleanup hook in the dashboard UI.                              |
| Multi-Factor Auth (MFA)    | Low    | The system lacks a secondary authentication factor, relying solely on JWT-based email/password login.            | Intentional scope control to prioritize core audio signal processing and threat engine stability.   | Evaluate third-party auth providers (Clerk or Auth0) to integrate MFA without increasing infrastructure complexity. |

---

## 2. Technical Debt Tracking

### Audit Trail Performance

As the database grows, the current "fetch all" approach for history will lead to UI lag.  
**Next Step:** Implement server-side pagination for the `/api/sessions` endpoint.

### Organization-level Management

The architecture supports multi-tenancy, but there is no UI for creating or managing "Organizations" or teams.  
**Next Step:** Extend the User model to include `orgId` and create a global Admin dashboard.
