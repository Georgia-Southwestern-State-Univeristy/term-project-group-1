## Admin & Maintenance Guide

**File Path:** `/docs/admin-guide.md`

---

### Setup & Deployment Summary

**Database**  
Requires a PostgreSQL instance reachable via the `DATABASE_URL`.

**API Credentials**  
A valid AssemblyAI API key is required for real-time speech-to-text functionality.

---

### Environment Initialization

Copy the environment file:

```bash
cp .env.example .env.local
```

Install dependencies:

```bash
npm install
```

Initialize the database schema:

```bash
npx prisma migrate dev
```

---

### Configuration Notes

| Variable             | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string (e.g., `postgresql://...`)    |
| `ASSEMBLYAI_API_KEY` | Your master key from the AssemblyAI dashboard              |
| `JWT_SECRET`         | Secret string for session signing. Logs a warning if empty |

---

### State Recovery & Reseeding

Run the following to restore demo data:

```bash
npx prisma db seed
```

This recreates:

- `agent@sentinel.local` (password: `agent123`)
- `supervisor@sentinel.local` (password: `supervisor123`)

---

### System Restart

```bash
npm run dev
```

The system automatically detects port conflicts (3000–3003) and binds to the first available port.

---

### Diagnostics & Monitoring

**Real-time Health**  
`GET /api/health` (unauthenticated). Returns HTTP 200 with database latency when healthy.

**Server Logs**  
Structured JSON logs are emitted to stdout. Key fields:

- `startup.env_check` → Missing config at boot
- `durationMs` → API performance timing
- `api.response` → Status codes (e.g., `503` if database is unreachable)
