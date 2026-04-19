# Week 14 Runbook — Deployment & Verification

**Deliverable:** Week 14, Deliverable B — Deployment / Runbook Verification
**Owner:** Ivan Herndon
**Date:** April 18, 2026
**Release candidate:** Sentinel `rc-v0.2`

---

## 1. Purpose & Audience

This runbook is the **single reproducible path** from a clean checkout to a
verified, running Sentinel instance on a local machine. It exists alongside
`docs/deployment/beta-deploy.md` (the longer narrative deployment guide) and
is intended for:

- **Instructors / reviewers** evaluating the Week 14 release candidate.
- **Future maintainers** picking the project up after hand-off.
- **Team members** re-verifying the run path before cutting a release.

Follow the steps in order. Every command is copy-paste runnable. The
"Verification log" at the bottom records exactly what failed when I walked
this path and what was corrected.

---

## 2. Prerequisites

| Requirement        | Version / Notes                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| Node.js            | 22.x (install via [nvm](https://github.com/nvm-sh/nvm): `nvm install 22 && nvm use 22`)                    |
| Package manager    | npm 10+ (ships with Node 22)                                                                               |
| Database           | PostgreSQL 15+ — either Docker (recommended, shown below) or a local install                               |
| AssemblyAI API key | Sign up at [assemblyai.com](https://www.assemblyai.com/dashboard/signup) — required for live transcription |
| Browser            | Chrome or Edge — audio capture is Chromium-only (tracked in `docs/final/week14-triage.md`)                 |

---

## 3. Environment Variables

All configuration lives in a single `.env` file at the repo root. **Use
`.env`, not `.env.local`** — see §8 for why.

| Variable             | Required | Purpose                                                                                                                                             |
| -------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | Yes      | PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/call_copilot?schema=public`)                                          |
| `ASSEMBLYAI_API_KEY` | Yes      | AssemblyAI key for real-time streaming STT. Endpoints fail 500 if missing.                                                                          |
| `JWT_SECRET`         | No       | Signs auth tokens. If unset, `instrumentation.ts` logs a warning and falls back to an insecure dev default. **Set this in any shared environment.** |

`.env.example` in the repo root lists the same variables and is the canonical
template.

---

## 4. Startup Steps

Run these in order from a fresh clone:

```bash
# 1. Clone and pin Node
git clone https://github.com/Georgia-Southwestern-State-Univeristy/term-project-group-1.git
cd term-project-group-1
nvm use 22
npm install

# 2. Configure environment
cp .env.example .env
$EDITOR .env          # fill in DATABASE_URL and ASSEMBLYAI_API_KEY

# 3. Start PostgreSQL (Docker option — skip if you already have PG 15+)
docker run -d \
  --name call-copilot-db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=call_copilot \
  -p 5432:5432 \
  postgres:15

# 4. Apply the checked-in schema migration (non-interactive)
npx prisma migrate deploy

# 5. Seed the two demo accounts
npx prisma db seed

# 6. Start the dev server
npm run dev
```

`scripts/dev.mjs` auto-selects the first free port in **3000–3003**. Override
with `PORT=<n> npm run dev` if needed.

### Seed accounts

| Email                       | Password        | Role       |
| --------------------------- | --------------- | ---------- |
| `agent@sentinel.local`      | `agent123`      | agent      |
| `supervisor@sentinel.local` | `supervisor123` | supervisor |

---

## 5. Post-Startup Health Verification

Confirm the stack is actually healthy before driving the UI.

### 5a. Startup log line

On boot, `instrumentation.ts` runs a `startup.env_check`. Expect to see one
of these JSON log lines in stdout (real log lines are single-line JSON;
wrapped below for readability):

```text
{"level":"info","event":"startup.env_check","data":{"status":"ok","message":"All required environment variables set"}}
```

or, if `JWT_SECRET` is intentionally unset for dev:

```text
{"level":"warn","event":"startup.env_check","data":{"status":"missing","message":"JWT_SECRET is not set — using insecure default (not safe for production)"}}
```

A `status: "missing"` line for `DATABASE_URL` or `ASSEMBLYAI_API_KEY` means
step 2 was skipped — fix before proceeding.

### 5b. `/api/health` endpoint

```bash
curl -s http://localhost:3000/api/health | python3 -m json.tool
```

Expected response (HTTP 200):

```json
{
  "status": "healthy",
  "uptime": 13,
  "database": {
    "status": "ok",
    "latencyMs": 33
  },
  "env": {
    "JWT_SECRET": "default (insecure)",
    "ASSEMBLYAI_API_KEY": "set",
    "DATABASE_URL": "set"
  }
}
```

`status: "degraded"` + HTTP 503 means the DB is unreachable — check that the
Postgres container is up and `DATABASE_URL` points at it.

### 5c. Login smoke test

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@sentinel.local","password":"agent123"}' | python3 -m json.tool
```

Expected: a JSON body containing `token` (JWT) and a `user` object with
`role: "agent"`. A `401` means the seed in step 5 did not run.

### 5d. Browser round-trip

1. Open `http://localhost:3000/login` in Chrome/Edge and sign in as the
   seeded agent.
2. Navigate to `/demo`, create a policy, create a session, click **Start**,
   grant microphone permission, speak — transcript should stream in and
   checklist items should auto-check when their trigger phrases are heard.
3. Click **Stop**, then visit `/history` — the just-ended session should
   appear with transcript, checklist results, and a composite threat score.

If all four of the above succeed, the system is healthy end-to-end.

---

## 6. Quality Gates (mirror CI)

Before cutting the release tag, run the same checks CI does (see
`.github/workflows/ci.yml`):

```bash
npm run format:check   # Prettier
npm run lint           # ESLint
npx tsc --noEmit       # TypeScript
npm test               # Jest
npm run build          # Next.js production build
```

**Observed on 2026-04-18 from a clean checkout (Node 22.18.0):**

| Check           | Result                                                    |
| --------------- | --------------------------------------------------------- |
| `format:check`  | All matched files use Prettier code style                 |
| `lint`          | clean (no warnings or errors)                             |
| `tsc --noEmit`  | clean                                                     |
| `npm test`      | **108 tests, 17 suites, all passing** (~5s)               |
| `npm run build` | Build succeeds; 16 routes compiled (4 static, 12 dynamic) |

If any check fails on a clean checkout, the release candidate should not be
tagged.

---

## 7. Related Deployment Artifacts

- `docs/deployment/beta-deploy.md` — longer narrative walkthrough of the
  same path (Docker vs local Postgres, first-run UI walkthrough). This
  runbook is the copy-paste summary; the deploy guide has the prose.
- `docs/admin-guide.md` — operator-facing notes on diagnostics, reseeding,
  and restart.
- `docs/user-guide.md` — agent/supervisor UI walkthrough once the system
  is up.

---

## 8. Verification Log — What Failed, What Was Corrected

I walked this run path top-to-bottom on 2026-04-18 from a clean state. Two
real drifts between the existing docs and the actual system behaviour
surfaced; both were corrected as part of this deliverable.

### Failure 1 — Prisma CLI did not load `.env.local`

**Symptom.** The existing setup docs instructed reviewers to
`cp .env.example .env.local` and then run `npx prisma migrate dev`. The
Prisma command failed immediately:

```
Error: P1012: Environment variable not found: DATABASE_URL.
  -->  prisma/schema.prisma:7
   |
 6 |   provider = "postgresql"
 7 |   url      = env("DATABASE_URL")
```

**Root cause.** Next.js auto-loads both `.env` and `.env.local`, but the
`prisma` CLI only auto-loads `.env`. With config only in `.env.local`, every
Prisma CLI command (`migrate deploy`, `db seed`, `migrate status`) fails
before it starts.

**Fix.** Canonicalized this project on `.env`:

- This runbook instructs `cp .env.example .env` (step 2 in §4).
- `.env` was added to `.gitignore` so a reviewer who follows the runbook
  cannot accidentally commit their AssemblyAI key.
- Next.js still loads `.env` with the same precedence as before, so
  `npm run dev` is unchanged. No shell `export` workaround is required.

Confirmation from the Prisma CLI after the fix:

```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "call_copilot", schema "public" at "localhost:5432"
```

### Failure 2 — `prisma migrate dev` prompted interactively

**Symptom.** Even after fixing the env-loading issue, the documented
`npx prisma migrate dev` step stalled waiting for a migration name because
no `prisma/migrations/` folder was checked into the repository. On CI or
during a reviewer's copy-paste session this hangs indefinitely.

**Fix.** Generated the initial migration once (`prisma migrate dev
--name init`, which produced
`prisma/migrations/20260418212347_init/migration.sql` plus
`migration_lock.toml`) and **committed it**. The runbook now uses
`npx prisma migrate deploy`, which applies checked-in migrations
non-interactively and is the correct command for any environment that
isn't the first developer writing a schema change.

Post-fix, a re-run is clean:

```
Environment variables loaded from .env
1 migration found in prisma/migrations
No pending migrations to apply.
```

### Observation — teammate PR #61 claims 92 tests

PR #61's updated `deploy.md` and release-candidate summary both cite 92
passing tests. The actual count on a clean checkout as of 2026-04-18 is
**108**, reflecting test additions merged in PRs #57–#60. Not a failure
— just noted here so future doc updates can sync to the current number.

### Remaining honest caveats

- Live transcription on `/demo` still requires a manually granted
  microphone permission; the flow stops until the user clicks **Allow**.
- Audio capture only works on Chromium-based browsers. Firefox support
  is on the Week 15 plan (`docs/final/week14-triage.md`).
- WebSocket reconnect after a network blip still requires a manual
  restart — also tracked for Week 15.

---

## 9. Quick Troubleshooting

| Symptom                                                         | Likely cause                                              | Fix                                                                                                        |
| --------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `P1001: Can't reach database server at localhost:5432`          | Postgres container not running                            | `docker ps` → if missing, re-run the `docker run` from §4 step 3                                           |
| `/api/health` returns 503 with `database.status: "unreachable"` | Same as above, or `DATABASE_URL` points at the wrong host | Check `.env`, then re-run the health curl                                                                  |
| `prisma` errors `Environment variable not found: DATABASE_URL`  | Config is in `.env.local` instead of `.env`               | `cp .env.local .env` (or just rename)                                                                      |
| Dev server picks port 3001/3002/3003                            | Something else is bound to 3000                           | Normal — `scripts/dev.mjs` fails over automatically. Look at the "Local:" line in stdout for the real URL. |
| `/api/assemblyai/token` returns 500                             | `ASSEMBLYAI_API_KEY` missing or invalid                   | Add the key to `.env` and restart `npm run dev`                                                            |
| Login returns 401 with seeded creds                             | `npx prisma db seed` didn't run, or the DB was wiped      | Re-run step 5 of §4                                                                                        |
