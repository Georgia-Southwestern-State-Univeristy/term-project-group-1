# Beta Release Notes

**Release Name:** Sentinel Beta  
**Release Tag:** beta-v0.1  
**Release Date:** April 3, 2026  

---

## 1. Project Overview

Sentinel is an AI-powered security dashboard designed to assist agents in real-time threat detection during voice interactions. By combining vocal frequency analysis with textual keyword detection and compliance checklists, Sentinel provides a live **"Composite Threat Score"** to identify high-risk callers and ensure protocol adherence.

---

## 2. Major Features & Workflows

###  Secure Authentication (JWT/RBAC)
Fully implemented login system using JSON Web Tokens and Role-Based Access Control, ensuring data isolation between Agents and Supervisors.

###  Composite Threat Scoring Engine
A real-time analysis pipeline that weights:
- Vocal stress (35%)
- Compliance checklist progress (35%)
- Textual keywords (30%)

These are combined into a dynamic risk percentage.

###  Persistent Historical Auditing
A complete `/history` view allowing supervisors to review ended sessions, including full transcripts and final threat scores retrieved from a PostgreSQL database.

###  Memory-Optimized Live Transcription
Implemented character-based windowing to ensure system stability and low latency during call sessions exceeding 20 minutes.

---

## 3. Important Fixes (Sprint 2)

###  Database Migration
Successfully transitioned the entire application from volatile in-memory storage to a persistent PostgreSQL layer via Prisma ORM.

### Schema Hardening
Replaced manual input checks with comprehensive Zod v4 schemas across all mutable API routes to prevent malformed data injection.

###  Reliability Enhancements
Added polling failure banners and improved WebSocket error messaging to provide agents with actionable feedback during network instability.

###  Persistence Bug Fix
Resolved an issue where session creation buttons remained disabled after a session ended, enabling continuous workflow without manual browser refreshes.

---

## 4. Known Limitations

###  Browser Compatibility
Audio capture currently fails to initialize on non-Chromium engines (e.g., Firefox), limiting use to Chrome and Edge for this release.

###  Connectivity Recovery
The system lacks automatic WebSocket reconnection; manual intervention is required if the transcription stream drops.

###  UI State Persistence
The checklist UI may occasionally retain "checked" states from a previous session until the page is manually refreshed.

###  Search Functionality
Advanced keyword searching within archived transcripts is currently deferred to a future release.