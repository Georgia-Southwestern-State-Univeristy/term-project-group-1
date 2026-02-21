# Call Co-pilot Dashboard

Real-time call co-pilot for call-center agents — live transcription,
compliance checklists, sentiment analysis, and threat scoring. Graduate
Software Engineering project at Georgia Southwestern State University.

## Prerequisites

- **Node.js 22** — install via [nvm](https://github.com/nvm-sh/nvm):
  ```bash
  nvm install 22
  nvm use 22
  ```
- **npm** (ships with Node)

No other global tools, databases, or API keys are needed to run the app
locally.

## Getting Started

```bash
git clone <repo-url>
cd term-project-group-1
nvm use 22          # ensure correct Node version
npm install         # install dependencies
npm run dev         # start dev server → http://localhost:3000
```

Open <http://localhost:3000> in your browser. You should see the landing
page.

## Available Commands

| Command                | What it does                              |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Start Next.js dev server (port 3000)      |
| `npm run build`        | Production build                          |
| `npm start`            | Start production server (run build first) |
| `npm test`             | Run Jest test suite                       |
| `npm run test:watch`   | Re-run tests on file changes              |
| `npm run lint`         | ESLint check                              |
| `npm run format`       | Auto-fix formatting (Prettier)            |
| `npm run format:check` | Check formatting without modifying files  |
| `npx tsc --noEmit`     | TypeScript type check                     |

### Running all quality checks (mirrors CI)

```bash
npm run format:check
npm run lint
npx tsc --noEmit
npm test
npm run build
```

If all five pass, your branch is ready for a PR.

## API Routes

| Method | Endpoint                   | Description                                   |
| ------ | -------------------------- | --------------------------------------------- |
| POST   | `/api/session`             | Create a call session (legacy stub)           |
| POST   | `/api/policies`            | Upload policy text → auto-generates checklist |
| GET    | `/api/policies`            | List all policies                             |
| GET    | `/api/policies/[policyId]` | Get a single policy with its checklist        |
| POST   | `/api/sessions`            | Create a session linked to a policy           |

## Verifying the Policy Upload Path

After starting the dev server (`npm run dev`), run these curl commands in
order to exercise the full policy → checklist → session flow:

**1. Upload a policy** (returns the policy with a generated checklist):

```bash
curl -s -X POST http://localhost:3000/api/policies \
  -H "Content-Type: application/json" \
  -d '{"name":"HIPAA Basic","text":"Verify caller identity\nConfirm date of birth\nRead privacy notice"}' | jq .
```

**2. List all policies** (confirm it was stored):

```bash
curl -s http://localhost:3000/api/policies | jq .
```

**3. Get the policy by ID** (copy the `id` from step 1):

```bash
curl -s http://localhost:3000/api/policies/<policyId> | jq .
```

**4. Create a session for that policy**:

```bash
curl -s -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"policyId":"<policyId>"}' | jq .
```

You should see `"status": "active"` and the `policyId` you provided.

**Automated tests** — the same flow is covered by the service-level
integration test:

```bash
npm test -- __tests__/policyUploadFlow.test.ts
```

## Project Structure

```
app/                  # Next.js App Router (pages, layouts, routes)
  api/                # API route handlers
  __tests__/          # Component and route tests
lib/
  domain/types.ts     # Shared TypeScript types
  repositories/       # In-memory data stores
  services/           # Business logic layer
__tests__/            # Service integration tests
docs/                 # ADRs, architecture diagrams, proposal
public/               # Static assets
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branching, PR, and code
standards. All changes must go through a PR with passing CI checks.
