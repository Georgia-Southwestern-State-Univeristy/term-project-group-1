# Authentication & Access Control Design

---

## 1. Authentication Mechanism

Sentinel utilizes **JWT-based session tokens** (via NextAuth.js / Clerk) to manage user identity.

- **Method:** Users authenticate via email/password or GitHub OAuth.
- **Persistence:** Sessions are stored in a secure, HTTP-only cookie to prevent XSS-based token theft.

---

## 2. Protected Resources

The following layers are protected and require a valid session:

- **Pages:** `/dashboard/*`, `/settings`, and `/history` are middleware-protected.
- **API Endpoints:** All `/api/sessions` and `/api/policies` routes require a Bearer token or valid session cookie.

---

## 3. Role Model (RBAC)

| Role                   | Permissions                                                                      |
| ---------------------- | -------------------------------------------------------------------------------- |
| **Agent (User)**       | Create sessions, view their own call history, upload personal policies           |
| **Supervisor (Admin)** | All Agent permissions + view all team call histories and global threat analytics |

---

## 4. Access Control Rule (Implementation)

To satisfy the Week 10 requirement, the **Session Ownership Rule** is implemented:

- **Rule:** A logged-in user can only access, update, or delete session data if their `userId` matches the `ownerId` in the database.
- **Enforcement:** Applied at the API route level.
- If violated, the server returns a `403 Forbidden` status.

---

## 5. Security Assumptions & Limitations

### Assumptions

- Server-side environment variables are securely stored.
- PostgreSQL instance is behind a private network.

### Limitations

- MFA (Multi-Factor Authentication) is not implemented.
- Session revocation (force logout) is not available in the Beta release.
