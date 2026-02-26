# Demo Readiness Checklist: Sentinel Dashboard

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)  
**Date:** February 26, 2026  
**Target Demo Timebox:** 5–7 minutes

---

## 1. Step-by-Step Demo Script

This script exercises the "Policy Upload → Checklist" flow currently implemented in the MVP.

1.  **Initialize Environment:** Open a terminal in the project root and run `npm run dev` to start the Next.js server on `http://localhost:3000`.
2.  **Verify Clean State:** Open a second terminal and run `curl -s http://localhost:3000/api/policies | jq .` to show that the in-memory store is ready for new data.
3.  **Upload Policy (The "Action"):** Execute the `POST` command to upload the "HIPAA Basic" policy text.
    ```bash
    curl -s -X POST http://localhost:3000/api/policies \
      -H "Content-Type: application/json" \
      -d '{"name":"HIPAA Basic","text":"Verify caller identity\nConfirm date of birth\nRead privacy notice"}' | jq .
    ```
4.  **Confirm Generation:** Point to the returned JSON object, specifically the `checklist` array, to show the system successfully parsed 3 distinct tasks with correct ordering.
5.  **Anchor a Session:** Use the `id` from the previous step to create a new active session:
    ```bash
    curl -s -X POST http://localhost:3000/api/sessions \
      -H "Content-Type: application/json" \
      -d '{"policyId":"<ID_FROM_STEP_3>"}' | jq .
    ```
6.  **Final Summary:** Explain that this session is now "Active" and ready for the real-time transcription and threat analysis features currently in development.

---

## 2. Seed Data Plan

To ensure a consistent and repeatable demo, we use the following "Golden Data":

- **Policy Name:** `Standard Security Protocol`
- **Policy Text:** 1. Greet the customer 2. Request Account Number 3. Verify Last 4 of SSN

---

## 3. Known Issues & Troubleshooting

| Potential Issue                                                     | Mitigation / Handling                                                                     |
| :------------------------------------------------------------------ | :---------------------------------------------------------------------------------------- |
| **Port Conflict:** Terminal says port 3000 is in use.               | Run `npx kill-port 3000` or use `npm run dev -- -p 3001`.                                 |
| **JSON Syntax Error:** `curl` command fails due to "Invalid JSON".  | Use the pre-formatted commands in `README.md` to avoid shell escaping issues.             |
| **Local Cache Lag:** Changes from a previous run persist in memory. | Restart the dev server (`Ctrl+C` then `npm run dev`) to clear the in-memory repositories. |

---

## 4. Fallback Plan (Environment Failure)

If the local environment fails to run during the live presentation:

1.  **Screen Recording:** A pre-recorded video of this exact `curl` sequence will be available in the repo at `/docs/mvp/demo-fallback.mp4`.
2.  **Postman Collection:** A pre-configured Postman collection is shared in the team workspace to execute the same requests without the terminal.

---

**Expectation:** Another teammate should be able to run this demo from this doc without guessing.
