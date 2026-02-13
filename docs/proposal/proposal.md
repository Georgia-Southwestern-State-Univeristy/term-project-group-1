# Project Proposal

**Jaxon Doolittle**  
**Ivan Herndon**  
Georgia Southwestern State University  
CSCI 6320: Advanced Software Engineering  
Dr. Jonathan Hobbs  
January 26, 2026

---

## The Problem & Target Users

### The Problem

High-stakes contact centers (medical or security operations) suffer from a visibility **blind spot** during live calls. Junior agents often deviate from critical compliance protocols under pressure and lack tools to detect sophisticated social engineering attacks in real time. Current solutions rely on post-call review, which is way too late to stop incidents as they happen.

### Target Users

- Medical Call Center Agents
- Security Operations Center (SOC) Analysts
- Compliance Officers

---

## Core Use Cases

### Scenario A: The _Policy Ingestion_

An admin uploads a standard **Credit Card Fraud Script** (PDF) to the dashboard. The system parses the text and automatically generates a **Live Checklist** of five mandatory questions that must be asked during a call.

### Scenario B: The _Co-Pilot Assist_

An agent accepts a call through the browser. As the caller speaks, the dashboard updates a **Stress Graph** in real time. When the agent asks a required question (e.g., _“Can you verify your last transaction?”_), the system detects the intent and automatically checks the box, confirming compliance.

### Scenario C: The _Threat Alert_

During a call, the caller becomes aggressive and tries to pressure the agent. The **Sentiment Score** spikes to **90% (Red/Critical)**. The dashboard flashes a warning:

> **High Aggression Detected – Recommend Termination**

This empowers the agent to safely end the call.

---

## Must-Have Features (Week 8 Beta Scope)

- **Browser-Based Audio Ingestion**  
  Live microphone capture via web browser (simulating a softphone) to avoid complex telephony integration.

- **Compliance Engine**  
  Allows admins to upload a **Policy Document** (PDF/TXT), which the system parses to generate a live checklist agents must follow.

- **Real-Time Voice Sentiment Analysis**  
  A live visual graph tracking the caller’s stress and aggression throughout the conversation.

- **Composite Threat Score**  
  A scoring system that calculates a final risk rating based on agent adherence versus caller sentiment.

---

## Non-Goals (Explicitly Out of Scope)

- Telephony integration (no SIP trunks, Twilio, or real phone carriers for Beta)
- Video analysis (audio and transcripts only)
- Custom LLM training (existing APIs like OpenAI will be used)

---

## Assumptions & Constraints

### Assumptions

- The user’s browser (Chrome/Edge) allows microphone access without specialized hardware drivers.
- Transcription latency from third-party APIs remains under five seconds for near real-time use.

### Constraints

- Limited to **Free Tier** rate limits from AI providers, which may restrict test calls to under five minutes.
- The application will be **single-tenant** for the Beta (local deployment, not SaaS).

---

## Risks (Technical, Scope, and Team)

- **Technical Risk**  
  API processing delays (3–5 seconds) could reduce the real-time feel of alerts.

- **Scope Risk**  
  The Compliance Engine may falsely flag valid agent responses if phrasing differs significantly from policy language.

- **Team Risk**  
  With a two-person team, availability issues could stall development.  
  **Mitigation:** Pair programming on critical architecture to ensure shared system knowledge.
