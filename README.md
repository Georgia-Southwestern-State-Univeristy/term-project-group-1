# Call Co-pilot Dashboard

Real-time call monitoring and threat detection system for call-center agents.
Provides live transcription, automated compliance checklists, vocal stress
analysis, and threat scoring. Graduate Software Engineering project at Georgia
Southwestern State University.

## 🏁 Reviewer Start Path

For the most accurate assessment of the Sentinel Final Release (v1.0), please follow this sequence:

1.  **[Release Candidate Summary](docs/releases/release-candidate.md):** Overview of stable workflows and major differences from the Beta phase.
2.  **[Architecture Snapshot](docs/final/week13-architecture.md):** View the current-state monolith design and component responsibilities.
3.  **[User Guide](docs/user-guide.md):** Use the seeded credentials (`agent@sentinel.local`) to execute the core call-assistance workflow.
4.  **[Final Bug Triage](docs/final/week14-triage.md):** Review our progress on instructor-identified risks (auth hardening, component size).
5.  **[Project Board](https://github.com/orgs/Georgia-Southwestern-State-Univeristy/projects/):** Evidence of sprint planning and task execution.

## Core Workflow

1. **Agent logs in** (`/login`) with email/password credentials
2. **Creates a policy and session** (`/demo`) — compliance checklists are auto-generated from policy text
3. **Starts live transcription** — microphone audio streams to AssemblyAI via WebSocket for real-time transcription
4. **During the call** — transcript appears live, checklist items auto-check when matching phrases are spoken, threat score updates based on compliance gaps, keywords, and vocal frequency
5. **Ends the session** — transcript ingestion stops, session is archived
6. **Reviews history** (`/history`) — browse ended sessions with full transcript, checklist results, and threat score breakdown

## Tech Stack

| Layer         | Technology                                                    |
| ------------- | ------------------------------------------------------------- |
| Framework     | Next.js 15 (App Router) + React 19 + TypeScript 5             |
| Database      | PostgreSQL 15+ via Prisma ORM (Mandatory)                     |
| Auth          | JWT (HS256) with role-based access control (Agent/Supervisor) |
| Transcription | AssemblyAI real-time streaming WebSocket                      |
| Logging       | Structured JSON logs with `durationMs` instrumentation        |

## Quick Start

# 1. Clone and Install

```bash
git clone https://github.com/Georgia-Southwestern-State-Univeristy/term-project-group-1.git
cd term-project-group-1
npm install
```

# 2. Configure Environment (Mandatory)

```bash
cp .env.example .env
# Open .env.local and provide your DATABASE_URL and ASSEMBLYAI_API_KEY
```

# 3. Initialize Database

```bash
npx prisma migrate deploy      # Applies PostgreSQL schema
npx prisma db seed           # Seeds demo users (agent@sentinel.local / agent123)
```

# 4. Launch

```bash
npm run dev                  # start dev server → http://localhost:3000
```

For detailed setup including PostgreSQL installation, Docker option, and
step-by-step first-run walkthrough, see the
**[Deployment Guide](docs/deployment/beta-deploy.md)**.

## Available Commands

| Command                | What it does                              |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Start Next.js dev server (port 3000)      |
| `npm run build`        | Production build                          |
| `npm start`            | Start production server (run build first) |
| `npm test`             | Run Jest test suite (109 tests)           |
| `npm run test:watch`   | Re-run tests on file changes              |
| `npm run lint`         | ESLint check                              |
| `npm run format`       | Auto-fix formatting (Prettier)            |
| `npm run format:check` | Check formatting without modifying files  |
| `npx tsc --noEmit`     | TypeScript type check                     |
| `npm run db:push`      | Push Prisma schema to database            |
| `npm run db:seed`      | Seed demo users                           |
| `npm run db:studio`    | Open Prisma Studio (DB browser)           |

## Environment Variables

| Variable             | Required | Description                          |
| -------------------- | -------- | ------------------------------------ |
| `DATABASE_URL`       | Yes      | PostgreSQL connection string         |
| `ASSEMBLYAI_API_KEY` | Yes      | Real-time transcription API key      |
| `JWT_SECRET`         | No       | JWT signing secret (has dev default) |

## API Routes

| Method | Endpoint                               | Description                                          |
| ------ | -------------------------------------- | ---------------------------------------------------- |
| POST   | `/api/auth/login`                      | Authenticate and receive JWT token                   |
| POST   | `/api/policies`                        | Upload policy text → auto-generates checklist        |
| GET    | `/api/policies`                        | List all policies                                    |
| GET    | `/api/policies/[policyId]`             | Get a single policy with its checklist               |
| POST   | `/api/sessions`                        | Create a session linked to a policy                  |
| GET    | `/api/sessions`                        | List sessions (filtered by role/status)              |
| POST   | `/api/sessions/[id]/transcript-events` | Ingest transcript events, auto-check items           |
| GET    | `/api/sessions/[id]/state`             | Get session, transcript, checklist, and threat score |
| POST   | `/api/sessions/[id]/end`               | End a session (idempotent)                           |
| POST   | `/api/sessions/[id]/frequency`         | Store vocal frequency snapshot                       |
| GET    | `/api/sessions/[id]/frequency`         | Get frequency snapshots for a session                |
| POST   | `/api/assemblyai/token`                | Mint temporary AssemblyAI streaming token            |

## Project Structure

```
app/                  # Next.js App Router (pages, layouts, routes)
  api/                # API route handlers
    auth/login/       # Authentication endpoint
    assemblyai/       # AssemblyAI token minting
    policies/         # Policy CRUD
    sessions/         # Session lifecycle + transcript + state + frequency
  login/page.tsx      # Login page
  call/page.tsx       # Call session UI (real-time transcription)
  demo/page.tsx       # Standalone transcription demo
  history/page.tsx    # Session history browser
  __tests__/          # Component and route tests
lib/
  auth.ts             # JWT auth, password hashing, ownership checks
  db.ts               # Prisma client singleton
  logger.ts           # Structured JSON logger
  domain/types.ts     # Shared TypeScript types
  repositories/       # Data access layer (Prisma-backed)
  services/           # Business logic layer
  validation/         # Zod schemas for request validation
  test-helpers/       # Auth helpers for test suites
__tests__/            # Workflow and integration tests
prisma/
  schema.prisma       # Database schema (User, Policy, Session, Transcript, etc.)
  seed.ts             # Demo user seeding script
docs/                 # Project documentation
public/
  worklets/           # AudioWorklet processors (pcm-processor.js)
```

## 🏁 Release Candidate Status (v0.2)

### What is Stable

- **Persistent Data Layer:** Full PostgreSQL integration for all sessions and policies.
- **Hardened Validation:** Unified Zod schemas via `parseRequestBody()` utility.
- **System Observability:** `/api/health` diagnostics and structured duration logging.
- **Regression Suite:** 90+ automated tests protecting core workflows.
- **Firefox Compatibility:** Primary audio capture currently restricted to Chromium engines.
- **Auth Hardening:** Server-side token revocation (deny-listing) upon logout.
- **Component Decomposition:** Refactoring the monolithic `/call` page to reduce component size.

## Documentation

| Document                                                   | Description                                     |
| ---------------------------------------------------------- | ----------------------------------------------- |
| [User Guide](docs/user-guide.md)                           | Step-by-step Agent/Supervisor walkthrough       |
| [Admin & Maintenance](docs/admin-guide.md)                 | Reseeding, diagnostics, and recovery            |
| [Architecture Snapshot](docs/final/week13-architecture.md) | **Current** system diagram and responsibilities |
| [Final Triage](docs/final/week14-triage.md)                | Ranked list of 8+ remaining release risks       |
| [Hand-Off Draft](docs/handoff/hand-off.md)                 | Maintenance plan for future teams               |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branching, PR, and code standards.
All changes must go through a PR with passing CI checks.
