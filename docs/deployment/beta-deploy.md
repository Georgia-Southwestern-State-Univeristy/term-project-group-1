# Beta Deployment Guide

**Team:** Group 1 (Jaxon Doolittle, Ivan Herndon)
**Date:** April 3, 2026

---

## 1. Prerequisites

- **Node.js 22** (install via [nvm](https://github.com/nvm-sh/nvm)):
  ```bash
  nvm install 22
  nvm use 22
  ```
- **PostgreSQL 15+** running locally or via Docker
- **npm** (ships with Node.js)

---

## 2. Clone and Install

```bash
git clone https://github.com/Georgia-Southwestern-State-Univeristy/term-project-group-1.git
cd term-project-group-1
nvm use 22
npm install
```

---

## 3. Environment Variables

Copy the example file and fill in values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with these required variables:

| Variable             | Required | Description                                                                                                    |
| -------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | Yes      | PostgreSQL connection string                                                                                   |
| `ASSEMBLYAI_API_KEY` | Yes      | API key for real-time transcription (get one at [assemblyai.com](https://www.assemblyai.com/dashboard/signup)) |
| `JWT_SECRET`         | No       | Secret for signing auth tokens (defaults to `dev-secret-change-me-in-production` in dev)                       |

Example `.env.local`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/call_copilot?schema=public
ASSEMBLYAI_API_KEY=your_key_here
JWT_SECRET=any-random-string-for-dev
```

---

## 4. Database Setup

### Option A: Local PostgreSQL

If PostgreSQL is already installed:

```bash
# Create the database
createdb call_copilot

# Push the Prisma schema to the database
npx prisma db push

# Seed demo users (agent + supervisor accounts)
npx prisma db seed
```

### Option B: Docker (no local PostgreSQL)

```bash
# Start a PostgreSQL container
docker run -d \
  --name call-copilot-db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=call_copilot \
  -p 5432:5432 \
  postgres:15

# Wait a few seconds for it to start, then push schema + seed
npx prisma db push
npx prisma db seed
```

### Verify Database

```bash
npx prisma studio
```

This opens a browser UI at `http://localhost:5555`. You should see the `users` table with two seed accounts.

### Seed Accounts

The seed script creates two users for testing:

| Email                       | Password        | Role       |
| --------------------------- | --------------- | ---------- |
| `agent@sentinel.local`      | `agent123`      | agent      |
| `supervisor@sentinel.local` | `supervisor123` | supervisor |

---

## 5. Run the Application

```bash
npm run dev
```

The dev server starts on `http://localhost:3000` (auto-selects the next available port if 3000 is in use). There is no separate backend server — Next.js serves both the UI and API routes.

For a production build:

```bash
npm run build
npm start
```

---

## 6. First Run Walkthrough

Follow these steps to exercise the full system workflow:

### Step 1: Log In

1. Open `http://localhost:3000/login`
2. Enter `agent@sentinel.local` / `agent123`
3. You should be redirected after successful login

### Step 2: Create a Policy (via API)

```bash
curl -s -X POST http://localhost:3000/api/policies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"name":"HIPAA Basic","text":"Verify caller identity\nConfirm date of birth\nRead privacy notice"}' | jq .
```

To get a token programmatically:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@sentinel.local","password":"agent123"}' | jq -r '.token')

echo $TOKEN
```

### Step 3: Run a Live Transcription Session

Navigate to `http://localhost:3000/demo`:

1. Enter a policy name and checklist items (one per line), click **Create Policy**
2. Click **Create Session**
3. Click **Start** and grant microphone access when prompted
4. Speak — the transcript appears in real time
5. Checklist items auto-check as matching phrases are detected
6. Click **Stop** to end the session

> **Note:** The `/demo` page is the primary workflow for the beta. It handles
> the full pipeline: policy creation, session management, live audio capture
> via AssemblyAI WebSocket, and auto-checklist matching.
>
> The `/call` page is a session monitoring dashboard that displays transcript,
> checklist, and threat score state. It does not yet include audio capture —
> integrating the streaming pipeline into `/call` is planned for the final
> release.

### Step 4: View History

Navigate to `http://localhost:3000/history`:

1. Ended sessions are listed with policy name, date, and duration
2. Click a session to expand and view transcript, checklist results, and threat score breakdown

---

## 7. Quality Checks (Mirror CI)

```bash
npm run format:check   # Prettier formatting
npm run lint           # ESLint
npx tsc --noEmit       # TypeScript type check
npm test               # Jest (82 tests)
npm run build          # Next.js production build
```

If all five pass, the system is in a healthy state.

---

## 8. Useful Commands

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start dev server (auto port selection)   |
| `npm run build`      | Production build                         |
| `npm start`          | Start production server                  |
| `npm test`           | Run test suite                           |
| `npm run db:migrate` | Run Prisma migrations                    |
| `npm run db:push`    | Push schema to DB (no migration history) |
| `npm run db:seed`    | Seed demo users                          |
| `npm run db:studio`  | Open Prisma Studio (DB browser)          |

---

## 9. Evidence of Testing

This setup path was validated by the team on April 3, 2026:

- Fresh clone → install → DB push → seed → `npm run dev` → login → create session → transcribe → end → view history
- All 82 automated tests pass on a clean checkout
- CI pipeline runs the same checks on every PR (see [CI workflow](../../.github/workflows/ci.yml))
