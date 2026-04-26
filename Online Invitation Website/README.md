# Invitely — Online Invitation App

A full-stack web app for creating beautiful, shareable event invitations with RSVP management.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL (via Sequelize ORM) |
| Auth | JWT in httpOnly cookies |
| Dev infra | Docker Compose |

---

## Getting started

### 1. Prerequisites

- Node.js 18+
- Docker Desktop

### 2. Clone & install

```bash
# From the project root
npm install
```

### 3. Configure environment variables

```bash
cp .env.example server/.env
# Edit server/.env and fill in JWT_ACCESS_SECRET and JWT_REFRESH_SECRET
# Generate secrets with:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL on port 5432 and Redis on port 6379.
The `database/migrations/` folder is auto-run on first boot.

### 5. Run the app

```bash
# Run server and client concurrently
npm run dev

# Or separately:
npm run dev:server   # http://localhost:3001
npm run dev:client   # http://localhost:5173
```

---

## API Reference — Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create a new host account |
| POST | `/api/auth/login` | — | Log in; sets httpOnly cookies |
| POST | `/api/auth/logout` | — | Clear auth cookies |
| POST | `/api/auth/refresh` | refresh cookie | Refresh the access token |
| GET | `/api/auth/me` | access cookie | Return the current user |

### Register / Login request body

```json
{
  "email": "you@example.com",
  "password": "yourpassword",
  "display_name": "Alex Johnson"
}
```

---

## Project structure

```
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/             # Axios client + per-resource API modules
│   │   ├── components/      # Reusable UI (ProtectedRoute, etc.)
│   │   ├── context/         # AuthContext
│   │   └── pages/           # Route-level pages
│   └── vite.config.js       # Dev proxy → localhost:3001
│
├── server/                  # Express backend
│   └── src/
│       ├── config/          # Sequelize DB connection
│       ├── controllers/     # Business logic
│       ├── middleware/       # auth, validate, errorHandler
│       ├── models/          # Sequelize models
│       ├── routes/          # Express routers
│       └── utils/           # JWT helpers
│
├── database/
│   └── migrations/          # SQL migration files (run by Docker on init)
│
├── docker-compose.yml
└── .env.example
```

---

## Implemented phases

- [x] **Phase 1** — Foundation: monorepo, Docker, auth API (register/login/logout/refresh/me), React app shell with login/register/dashboard pages

## Coming next

- [ ] Phase 2 — Event creation API + multi-step event builder UI
- [ ] Phase 3 — Public event page + RSVP flow
- [ ] Phase 4 — Host dashboard + guest list management
- [ ] Phase 5 — Email notifications + reminders
- [ ] Phase 6 — Themes, CSV import/export, production deploy
