# Online Invitation App — Combined Plan

**Focus:** Birthday & party invitations
**Stack:** React (Vite) + Node.js/Express + PostgreSQL
**Auth:** JWT-based (hosts only)
**Scope:** Invitations, RSVPs, event pages, post-event follow-up

---

## Overview

A web app where hosts create beautiful, shareable event pages for birthday parties and celebrations. Each invite gets its own URL slug — no custom domains needed. Guests access the invite via a shared link and RSVP with their name, contact info, and separate adult and kid counts. Hosts manage their guest list, send reminders, and follow up after the event. The guest-facing event page is fully responsive and looks great on both desktop and mobile browsers.

---

## User Types

### Host
- Must have an account (authenticated)
- Can create, edit, and manage invites via a multi-step event builder
- Gets a shareable link per invite
- Can publish, close, re-open, or archive invites
- Can view all RSVPs on a dashboard, export as CSV, and manually add/remove guests
- Can trigger email reminders and post-event follow-ups

### Guest
- No account required
- Accesses invite via shared link
- Can RSVP (attending / declined / maybe), with name, email, number of adults, number of kids, and an optional note
- Receives a confirmation email with an edit link
- Can change or cancel their RSVP via that link (unless the invite is closed)

---

## URL Structure

- Public event page: `/:slug` — e.g. `yoursite.com/jakes-30th-a3x`
- RSVP form: `/:slug/rsvp`
- Guest RSVP edit: `/:slug?edit=[edit_token]`
- Slug auto-generated from event title with a short random suffix for uniqueness
- Host can customize the slug, but changing it breaks existing shared links (warn them)

**Slug generation:**
```js
function generateSlug(title) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const suffix = Math.random().toString(36).slice(2, 5); // e.g. "a3x"
  return `${base}-${suffix}`;
}
```
Collision detection with auto-append (e.g. `jakes-30th-2`) as a fallback.

---

## Invite Status Lifecycle

```
Draft → Published → Closed → Archived
               ↑__________|  (re-open allowed)
```

- **Draft:** created but not yet shared
- **Published:** link is live, guests can RSVP
- **Closed:** RSVPs locked, form replaced with "RSVPs are closed" message
- **Archived:** hidden from active list, host-only view

---

## Architecture

```
online-invitation-app/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-level page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── context/           # Auth context, theme context
│   │   ├── api/               # Axios API client
│   │   └── utils/             # Helpers, formatters
│   └── public/
├── server/                    # Node.js + Express backend
│   ├── routes/                # API route handlers
│   ├── controllers/           # Business logic
│   ├── models/                # Sequelize ORM models
│   ├── middleware/            # Auth, error handling, validation
│   ├── services/              # Email, QR code, file upload
│   └── utils/
├── database/
│   └── migrations/            # SQL migration files
└── docker-compose.yml         # Local dev environment
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | VARCHAR | Unique |
| password_hash | VARCHAR | bcrypt |
| display_name | VARCHAR | |
| avatar_url | VARCHAR | Optional |
| created_at | TIMESTAMP | |

### `events`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| host_id | UUID | FK → users |
| slug | VARCHAR | Unique URL slug (e.g. `jakes-30th`) |
| title | VARCHAR | |
| description | TEXT | |
| event_date | TIMESTAMP | |
| event_end_date | TIMESTAMP | Optional |
| location_name | VARCHAR | |
| location_address | TEXT | |
| location_lat | FLOAT | Optional, for map embed |
| location_lng | FLOAT | Optional |
| cover_image_url | VARCHAR | |
| theme | VARCHAR | `confetti`, `neon`, `elegant` |
| max_guests | INTEGER | NULL = unlimited |
| is_public | BOOLEAN | |
| rsvp_deadline | TIMESTAMP | |
| status | ENUM | `draft`, `published`, `closed`, `archived` |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `guests`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| event_id | UUID | FK → events |
| name | VARCHAR | |
| email | VARCHAR | |
| phone | VARCHAR | Optional |
| rsvp_status | ENUM | `pending`, `attending`, `declined`, `maybe` |
| adult_count | INTEGER | Number of adults (including the RSVP-ing guest); default 1 |
| kid_count | INTEGER | Number of kids; default 0 |
| edit_token | VARCHAR | Unique; enables guest edits without login |
| rsvp_at | TIMESTAMP | |
| message | TEXT | Optional note to host |
| reminded_at | TIMESTAMP | |

### `event_updates`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| event_id | UUID | FK → events |
| content | TEXT | |
| send_email | BOOLEAN | Whether to email guests |
| created_at | TIMESTAMP | |

---

## Key Design Decisions

### Guest RSVP Editing (no login needed)
- On RSVP submit → generate a random `edit_token` and store it on the guest record
- Send confirmation email with link: `/:slug?edit=[token]`
- On that URL → load the existing RSVP, allow changes or cancellation
- If the event is `closed`, show a message instead of the edit form

### Host Invite Editing
- All fields (title, date, location, description, theme, slug) are editable
- Changing the slug breaks existing shared links — warn the host explicitly
- Status transitions are explicit host actions: publish, close, re-open, archive

### Responsive Design
- The guest-facing event page and RSVP form must look great on both desktop and mobile browsers
- Use Tailwind CSS responsive utilities throughout; design mobile-first
- Touch-friendly tap targets, readable font sizes, and no horizontal scrolling on mobile

---

## Phase 1 — Foundation (Week 1–2)

### 1.1 Project Setup
- Initialize monorepo with `client/` (Vite + React) and `server/` (Node/Express) folders
- Set up ESLint, Prettier, and shared TypeScript config
- Configure Docker Compose with PostgreSQL and Redis (for sessions/cache)
- Set up environment variable management (`.env.example`)

### 1.2 Authentication API
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Return JWT
- `POST /api/auth/logout` — Invalidate token
- `GET /api/auth/me` — Return current user profile
- JWT stored in httpOnly cookie with refresh token pattern

---

## Phase 2 — Event Creation (Week 2–3)

### 2.1 Event Builder (Host Flow)

A multi-step form with live preview:

- **Step 1 — Basics:** Title, date/time, location (with optional Google Maps embed)
- **Step 2 — Customize:** Cover image upload, color theme selector, description (rich text)
- **Step 3 — Settings:** Guest cap, RSVP deadline, public/private toggle
- **Step 4 — Review & Publish:** Preview the event page, copy the shareable link

**API endpoints:**
- `POST /api/events` — Create event (draft)
- `PUT /api/events/:id` — Update event
- `POST /api/events/:id/publish` — Set status to published
- `POST /api/events/:id/close` — Close RSVPs
- `POST /api/events/:id/reopen` — Re-open RSVPs
- `POST /api/events/:id/archive` — Archive event
- `DELETE /api/events/:id` — Delete event (soft delete)
- `GET /api/events/mine` — List host's events

### 2.2 Image Upload
- Use `multer` + local storage in dev; S3-compatible (Cloudflare R2) in production
- Auto-resize/optimize images using `sharp`

---

## Phase 3 — Guest-Facing Event Page (Week 3–4)

### 3.1 Public Event Page (`/:slug`)
- Fully themed landing page with cover image, event details, countdown timer
- Location section with embedded map
- Fully responsive layout — works on desktop and mobile browsers
- RSVP form (name, email, phone, number of adults, number of kids, optional message)
- Real-time spots-remaining counter if `max_guests` is set
- "Add to Calendar" buttons (Google, Apple, Outlook)
- If invite is `closed`: show closed banner instead of RSVP form

### 3.2 RSVP Flow
- `POST /api/events/:slug/rsvp` — Submit RSVP; generates `edit_token`
- On success: confirmation screen
- Guest receives confirmation email with event details and edit link

### 3.3 Guest RSVP Edit (`/:slug?edit=[token]`)
- Load existing RSVP by `edit_token`; allow changes or cancellation
- If invite is `closed`, show message instead of edit form

---

## Phase 4 — Host Dashboard (Week 4–5)

### 4.1 Dashboard Overview
- List of all events with status badges (upcoming, past, draft)
- Quick stats: total invited, attending, declined, pending
- Quick actions: Edit, Copy link, Send reminder, Close/Re-open, Archive

### 4.2 Guest List Management
- Filterable/sortable table: name, email, phone, RSVP status, adult count, kid count, total headcount
- Manually add guests; bulk CSV import supported
- Export guest list as CSV
- Remove or edit individual guests

**API:**
- `GET /api/events/:id/guests` — Paginated guest list with filters
- `POST /api/events/:id/guests` — Manually add a guest
- `PUT /api/events/:id/guests/:guestId` — Update guest record
- `DELETE /api/events/:id/guests/:guestId` — Remove guest
- `POST /api/events/:id/guests/import` — CSV bulk import

---

## Phase 5 — Notifications & Follow-up (Week 5–6)

### 5.1 Email Service
- **Nodemailer** with an SMTP provider (Resend or SendGrid)
- HTML email templates via **MJML** (responsive)
- Triggered emails:
  - RSVP confirmation (to guest, with edit link)
  - New RSVP notification (to host — batched daily digest)
  - Event reminder (1 week and 1 day before; configurable)
  - Event update/announcement
  - Post-event thank-you

### 5.2 Reminder System
- Host can manually trigger reminders from dashboard
- Automatic reminders via cron job (`node-cron`) — checks for events due for reminder
- Reminder targets: all guests, attending only, or pending only

### 5.3 Post-Event Follow-up
- After event date passes, event moves to `archived` status
- Host can post a message to the event page (visible to anyone with the link)
- Optional: send a thank-you email to attending guests
- Host can share a photo album link or embed (external URL)

---

## Phase 6 — Polish & Production (Week 6–7)

### 6.1 Themes & Customization

Three built-in invitation themes:
- **Confetti** — colorful, playful, great for birthdays
- **Elegant** — soft pastel tones, clean typography
- **Neon** — dark background, vibrant accent colors, great for adult parties

Each theme controls: font family, primary color, background, card style, button style.

### 6.2 All Pages & Routes

| Route | Who | Description |
|---|---|---|
| `/` | Public | Landing / marketing page |
| `/login` | Host | Login |
| `/register` | Host | Registration |
| `/dashboard` | Host | List of all events with status badges |
| `/events/new` | Host | Create event (multi-step builder) |
| `/events/:id/edit` | Host | Edit event details |
| `/events/:id/guests` | Host | Guest list management |
| `/:slug` | Guest | Public event page (or closed banner) |
| `/:slug/rsvp` | Guest | RSVP form |
| `/:slug?edit=[token]` | Guest | Edit or cancel existing RSVP |

### 6.3 Key Libraries

**Frontend:**
- `react-router-dom` — routing
- `react-hook-form` + `zod` — forms & validation
- `@tanstack/react-query` — data fetching & caching
- `framer-motion` — animations
- `date-fns` — date formatting
- `react-confetti` — celebratory effects

**Backend:**
- `express` + `cors` + `helmet` — server
- `sequelize` + `pg` — ORM + PostgreSQL driver
- `bcrypt` — password hashing
- `jsonwebtoken` — JWT auth
- `multer` + `sharp` — file upload + image processing
- `nodemailer` — email sending
- `node-cron` — scheduled tasks
- `joi` — request validation
- `express-rate-limit` — rate limiting

### 6.4 Security Checklist
- Passwords hashed with bcrypt (cost factor 12)
- JWT stored in httpOnly, SameSite=Strict cookies
- Rate limiting on auth and RSVP endpoints
- Input validation on all routes (Joi)
- CORS restricted to frontend origin
- SQL injection protection via parameterized queries (Sequelize)
- File upload type/size validation

### 6.5 Deployment
- **Frontend:** Vercel or Netlify
- **Backend:** Railway or Fly.io (Node.js container)
- **Database:** Supabase (managed PostgreSQL) or Railway Postgres
- **File Storage:** Cloudflare R2 or AWS S3
- **Email:** Resend (generous free tier)
- CI/CD via GitHub Actions: lint → test → deploy on merge to `main`

---

## Milestones Summary

| Week | Milestone |
|---|---|
| 1 | Project scaffolding, DB schema, auth API |
| 2 | Event creation API + basic event builder UI |
| 3 | Public event page + RSVP flow + guest edit token |
| 4 | Host dashboard + guest list management |
| 5 | Email notifications + reminders + post-event follow-up |
| 6 | Themes, CSV import/export, responsive polish |
| 7 | Polish, security hardening, staging + production deploy |

---

## Future Considerations (not in v1)
- Payment/ticketing for paid events (Stripe)
- Photo sharing gallery embedded on event page
- SMS reminders via Twilio
- Social sharing meta tags (Open Graph) for rich link previews
- AI-generated invitation text/descriptions
- Waitlist support if a capacity limit is hit
- QR code download for the invite link itself
- Custom invite themes / background images
