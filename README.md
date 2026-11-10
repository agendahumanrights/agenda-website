# Agenda

Public website and admin foundation for **[humanrightsagenda.org](https://humanrightsagenda.org)** — bilingual (Arabic / English) publications, events, and About Us.

Requirements source: [`Agenda Website.pdf`](./Agenda%20Website.pdf) · readable mirror: [`docs/WEBSITE_REQUIREMENTS.md`](./docs/WEBSITE_REQUIREMENTS.md)

Architecture notes: [`docs/PROJECT_FOUNDATION.md`](./docs/PROJECT_FOUNDATION.md) · roadmap: [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) · living reference: [`agenda_website_reference.MD`](./agenda_website_reference.MD)

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- PostgreSQL + Prisma ORM 7
- Zod validation; Argon2id (`@node-rs/argon2`) for admin passwords
- npm (`package-lock.json`)

## Localization

- English URLs are unmarked: `/`, `/publications`, `/events`, `/about`.
- Arabic URLs use the `/ar` prefix: `/ar`, `/ar/publications`, …
- Language cookie: `agenda_locale` (`ar` | `en`) — used by the switcher and admin UI.
- Legacy `?lang=ar` redirects to `/ar/...`; `/en/...` redirects to unmarked English.

## Admin authentication (Phase 2)

- Login: `/admin/login` → `POST /api/admin/auth/login`
- Logout: `POST /api/admin/auth/logout` (never GET)
- Session: HttpOnly cookie (`agenda_admin_session` by default); only a SHA-256 hash is stored (`AdminSession`)
- Lifetime: **7 days**
- CSRF: `Origin` / `Referer` must match `NEXT_PUBLIC_SITE_URL` (and optional `AUTH_TRUSTED_ORIGINS`)
- Throttling: **5** failures / **15 minutes** per email and per IP key in PostgreSQL (`LoginThrottle`); trust `X-Forwarded-For` only when `TRUST_PROXY=true`

### Content admin (implemented)

- Publications: `/admin/publications` — CRUD, publish rules, image/PDF uploads, Markdown
- Events: `/admin/events` — CRUD, publish rules, image gallery (no PDF), Markdown
- Founders: `/admin/founders` — CRUD, reorder, profile images; About Us + blog author links
- **Dates:** event `eventDate` (visitor-facing) ≠ record `createdAt` (creation-date filter)
- Media: shared upload API; `STORAGE_PROVIDER=local` or `r2` (Cloudflare R2); `GET /api/media/...` access-checked for legacy/local keys
- Homepage: `/api/admin/homepage` / UI — publications and up to **3** events; sectioned saves
- Vision/mission organizational copy remains outside admin

### Setup with a database

```bash
cp .env.example .env
# Set DATABASE_URL + DIRECT_URL (Supabase: pooler :6543 vs session/direct :5432), NEXT_PUBLIC_SITE_URL
# Set ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD for provisioning (never commit real secrets)
# Optional: STORAGE_PROVIDER=local|r2, UPLOAD_DIR=uploads
# For r2: set R2_* variables (see .env.example and CLOUDFLARE_R2_STORAGE.md)

npm install
npx prisma migrate deploy
npm run admin:create
npm run dev
```

`admin:create` is **not** run by install/build. Re-running it does not reset an existing administrator’s password.

**Production media:** set `STORAGE_PROVIDER=r2` and the `R2_*` variables. See [CLOUDFLARE_R2_STORAGE.md](CLOUDFLARE_R2_STORAGE.md). Local disk is for development only.

## Requirements

- Node.js 20.19+ recommended (Prisma 7)
- PostgreSQL for auth and database-backed features (public shell runs without it)

## Environment

See [`.env.example`](.env.example). Important keys:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL runtime (Supabase transaction pooler) |
| `DIRECT_URL` | PostgreSQL for Prisma CLI / migrations (Supabase session or direct) |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for CSRF |
| `ADMIN_SESSION_COOKIE_NAME` | Session cookie name |
| `TRUST_PROXY` | `true` only behind a trusted proxy |
| `ADMIN_BOOTSTRAP_*` | Provisioning only |
| `STORAGE_PROVIDER` | `local` (default), `r2`, or `unimplemented` |
| `UPLOAD_DIR` | Local upload root (default `uploads`) |
| `UPLOAD_MAX_*` | Optional image/PDF size limits and `UPLOAD_MAX_IMAGES_PER_ITEM` (default 10) |
| `R2_*` | Cloudflare R2 credentials + `R2_PUBLIC_BASE_URL` (when `STORAGE_PROVIDER=r2`) |

## Prisma

```bash
npm run prisma:validate
npm run prisma:generate
npx prisma migrate deploy   # apply existing migrations (uses DIRECT_URL)
npm run prisma:migrate      # prisma migrate dev when iterating locally
```

Initial migration: `prisma/migrations/20251018100000_init/`.

## Development

```bash
npm run dev
```

| Path | Notes |
| --- | --- |
| `/` | Public home |
| `/admin/login` | Administrator sign-in |
| `/admin` | Dashboard (requires session) |

## Validation commands

```bash
npm run typecheck
npm run lint
npm test
npm run prisma:validate
npm run prisma:generate
npm run build
```

## Package manager

Use **npm** with the existing `package-lock.json`.
