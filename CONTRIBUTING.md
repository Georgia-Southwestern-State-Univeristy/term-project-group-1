# Contributing Guide

This repository follows short-lived branch development, PR-only merges, and enforced CI checks.

Our goal is to treat this project like a professional engineering system, not a class assignment folder.

---

## Branching Strategy

We follow trunk-based development:

- `main` is always deployable.
- All work happens on short-lived branches.
- Branch naming format:

  feat/<short-description>
  fix/<short-description>
  docs/<short-description>
  chore/<short-description>

Examples:

- feat/add-session-endpoint
- fix/orchestrator-timeout
- docs/update-architecture

Branches should live no longer than 1–3 days.

---

## Pull Request Requirements

A PR must:

- Be opened early (not after everything is complete)
- Be small and focused
- Include a clear description of what changed and why
- Link to any relevant ADR or architecture document
- Pass CI checks
- Receive at least 1 teammate review
- Not be self-approved

If CI fails, the PR cannot be merged.

---

## Code Standards

We enforce consistent style using:

- Prettier (formatting)
- ESLint (linting)

All contributors must:

- Run formatting locally before pushing
- Fix lint errors before requesting review

### Running checks locally

Run all of these before pushing — they mirror what CI runs on every PR:

```bash
npm run format       # auto-fix formatting (Prettier)
npm run format:check # check formatting without modifying files
npm run lint         # run ESLint
npx tsc --noEmit     # TypeScript type check
npm test             # run Jest test suite
npm run build        # production build
```

> **Tip:** Run `npm run format` first — it often fixes issues that ESLint would also flag.

## Tests

New behavior must include:

- Starter-level test coverage, or
- A documented test plan in the PR description

Even minimal tests are acceptable at this stage — but no silent behavior changes.

Tests live in `app/__tests__/` and run with:

```bash
npm test              # single run
npm run test:watch    # re-run on file changes (useful during development)
npm run test:coverage # run with coverage report
```

---

## Definition of Done

See `/docs/team/definition-of-done.md`.

No feature is considered complete unless it meets that checklist.
