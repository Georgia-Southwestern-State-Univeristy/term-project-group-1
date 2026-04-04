# Call Co-pilot Dashboard

Real-time call monitoring and threat detection system for call-center agents.
Provides live transcription, automated compliance checklists, vocal stress
analysis, and threat scoring. Graduate Software Engineering project at Georgia
Southwestern State University.

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
| Framework     | Next.js 16 (App Router) + React 19 + TypeScript 5             |
| Styling       | Tailwind CSS v4                                               |
| Database      | PostgreSQL 15+ via Prisma ORM                                 |
| Auth          | JWT (HS256) with role-based access control (agent/supervisor) |
| Transcription | AssemblyAI real-time streaming WebSocket                      |
| Testing       | Jest 30 + Testing Library                                     |
| CI            | GitHub Actions (lint, format, typecheck, test, build)         |

## Quick Start

```bash
git clone https://github.com/Georgia-Southwestern-State-Univeristy/term-project-group-1.git
cd term-project-group-1
nvm use 22
npm install
cp .env.example .env.local   # fill in DATABASE_URL and ASSEMBLYAI_API_KEY
npx prisma db push            # create database tables
npx prisma db seed            # seed demo users
npm run dev                   # start dev server → http://localhost:3000
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
| `npm test`             | Run Jest test suite (82 tests)            |
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

## Beta Scope

### What is Working

- **Authentication** — Email/password login with JWT tokens, role-based access control (agent vs. supervisor), session ownership enforcement
- **Policy management** — Create policies with text, auto-generate compliance checklists
- **Session lifecycle** — Create, ingest transcript, end, and archive sessions
- **Real-time transcription** — AssemblyAI WebSocket streaming with live transcript display
- **Auto-checklist** — Checklist items auto-check when matching phrases appear in transcript
- **Threat scoring** — Composite score from compliance gaps, keyword detection, and vocal frequency stress analysis
- **Session history** — Browse ended sessions with full transcript, checklist, and threat score
- **Input validation** — Zod schemas on all API inputs with structured error messages
- **Structured logging** — JSON-formatted logs with session context
- **Reliability** — Error handling on all DB operations, polling failure indicators, WebSocket error messages

### What is Intentionally Incomplete

- **Session revocation** — No force-logout or token blacklist (acceptable for single-tenant beta)
- **WebSocket auto-reconnect** — User must manually restart streaming if connection drops
- **Rate limiting** — Not implemented; acceptable for single-tenant prototype
- **MFA** — Not in scope for beta
- **Supervisor dashboard** — Supervisors can view all sessions but have no dedicated analytics UI

### What is Planned Next

- Auto-reconnect for WebSocket streaming with exponential backoff
- Supervisor analytics dashboard (aggregate threat scores, team compliance)
- Cloud deployment (Vercel + managed PostgreSQL)
- Session export (PDF/CSV reports)

## Documentation

| Document                                                     | Description                                 |
| ------------------------------------------------------------ | ------------------------------------------- |
| [Deployment Guide](docs/deployment/beta-deploy.md)           | Full setup, run, and first-run walkthrough  |
| [Quality Summary](docs/beta/week12-quality.md)               | Test counts, CI evidence, coverage analysis |
| [Known Issues](docs/beta/week12-known-issues.md)             | Prioritized bug triage and technical debt   |
| [Release Notes](docs/releases/beta-release.md)               | Beta v0.1 release notes                     |
| [Reliability](docs/beta/week11-reliability.md)               | Risk analysis and fixes from Week 11        |
| [Authentication](docs/security/auth.md)                      | Auth design, RBAC model, ownership rules    |
| [Beta Plan](docs/beta/beta-plan.md)                          | Beta release planning                       |
| [Architecture](docs/architecture/first-pass-architecture.md) | C4 container diagram and design             |
| [ADR-001](docs/adr/ADR-001.md)                               | Architecture Decision Record: Next.js       |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branching, PR, and code standards.
All changes must go through a PR with passing CI checks.
