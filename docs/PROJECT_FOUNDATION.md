# Agenda — Project Foundation (Phase 1)

## Architecture and decisions

- **Framework:** Next.js 16 App Router + React 19 + TypeScript, existing `src/` layout preserved.
- **Styling:** Tailwind CSS v4 (already installed). Components are minimal placeholders — not final design.
- **Database assumption:** PostgreSQL via **Prisma ORM 7** (requirements PDF does not name a database; this is the project default).
- **HTTP API:** Next.js Route Handlers under `src/app/api/**`. No separate Express server.
- **Request flow:** Route Handler → Zod validation + authorization → service → Prisma. Server Components call services directly (no self-HTTP).
- **Locale:** English unmarked URLs; Arabic under `/ar` (proxy rewrite). Cookie `agenda_locale` stores `ar` | `en` for the switcher/admin (default **Arabic** when cookie missing/invalid). Server Components read locale via `getRequestLocale()` (`x-agenda-lang` header, then cookie). Legacy `?lang=ar` redirects to `/ar/...`; `/en/...` redirects to unmarked.
- **i18n:** Lightweight dictionary files in `src/messages/{ar,en}.json` (UI chrome only). Content translations live in the database.
- **Admin security (Phase 2):** Opaque HttpOnly session cookie + `AdminSession` rows (token hash only). Passwords use Argon2id. Login/logout at `/api/admin/auth/*` with Origin CSRF checks and DB-backed throttling. Protected pages redirect to `/admin/login`; APIs return 401 without a session. Content mutations remain **501**.
- **Storage:** Vendor-agnostic `StorageProvider` interface only — no upload vendor chosen.

### Slug strategy

- Each `Publication` and `Event` has one **canonical** `slug` (language-independent, unique).
- Public URLs: `/publications/{slug}`, `/events/{slug}` — the same record in both languages.
- Titles, subtitles, and descriptions remain on translation tables; the active language comes from the URL locale (and cookie in admin).
- Lookups resolve by slug, then load the translation for the active locale (missing translation → not-found / empty).

### Rules: Prisma vs service

| Rule | Enforced by |
| --- | --- |
| Unique canonical slug, FKs, cascades | Prisma |
| Only `PUBLISHED` in public queries | Service (and public API) |
| Blog requires founder author; non-blogs must not | Service (later mutations) |
| Both `ar` + `en` translations before publish | Service (later mutations) |
| Max 3 featured events | Service + Zod (`max(3)`) + transaction (later) |
| Featured items must be published | Service eligibility checks |

---

## Folder / file tree (responsibilities)

```
agenda/
├── prisma/
│   └── schema.prisma          # Data model
├── prisma.config.ts           # Prisma 7 datasource config
├── .env.example               # Placeholder env vars
├── docs/
│   ├── WEBSITE_REQUIREMENTS.md
│   ├── PROJECT_FOUNDATION.md
│   └── IMPLEMENTATION_PLAN.md
├── public/images/             # Static image assets
├── src/
│   ├── proxy.ts               # Legacy locale-prefix redirects + cookie set
│   ├── app/
│   │   ├── layout.tsx         # html/lang/dir from cookie + fonts
│   │   ├── globals.css
│   │   ├── loading.tsx | error.tsx | not-found.tsx
│   │   ├── (public)/          # Site chrome + public pages
│   │   ├── admin/
│   │   │   ├── (auth)/login/
│   │   │   └── (protected)/   # Fail-closed shell
│   │   └── api/               # Public + admin route handlers
│   ├── components/
│   ├── server/
│   ├── i18n/                  # Cookie locale, dictionaries, site paths, setLocale action
│   ├── messages/
│   ├── content/
│   ├── lib/
│   ├── types/
│   └── generated/prisma/
```

---

## Public / admin route map

Language is **not** part of these paths.

### Public

| Path | Purpose |
| --- | --- |
| `/` | Home |
| `/publications` | Publications index |
| `/publications/[slug]` | Publication detail (canonical slug) |
| `/events` | Events index |
| `/events/[slug]` | Event detail (canonical slug) |
| `/about` | About Us |

### Admin

| Path | Purpose |
| --- | --- |
| `/admin/login` | Login (outside protected layout) |
| `/admin` | Dashboard (session required) |
| `/admin/publications` (+ new/edit) | Publications admin (**implemented**) |
| `/admin/events` (+ new/edit) | Events admin (**implemented**) |
| `/admin/founders` (+ new/edit) | Founders admin (**implemented**) |
| `/admin/homepage` | Featured publications + events (max 3) (**implemented**) |

### Legacy redirects

| From | To | Cookie |
| --- | --- | --- |
| `/ar`, `/ar/...` | `/`, `/...` | sets `agenda_locale=ar` |
| `/en`, `/en/...` | `/`, `/...` | sets `agenda_locale=en` |

Query strings are preserved. `/api` and static assets are not redirected.

### API

| Method | Path | Status |
| --- | --- | --- |
| GET | `/api/publications` | List published (`locale` query optional; defaults from cookie) |
| GET | `/api/publications/[slug]?locale=` | Detail by canonical slug |
| GET | `/api/events` | List published |
| GET | `/api/events/[slug]?locale=` | Detail by canonical slug |
| POST | `/api/admin/auth/login` | Login + Set-Cookie |
| POST | `/api/admin/auth/logout` | Revoke session + clear cookie |
| * | `/api/admin/publications/**` | Implemented (session + CSRF on mutations) |
| * | `/api/admin/events/**` | Implemented (session + CSRF on mutations) |
| * | `/api/admin/founders/**` | Implemented (+ `PUT .../reorder`) |
| POST | `/api/admin/media/upload` | Multipart; pub/event/founder image (+ pub PDF) |
| GET/PUT | `/api/admin/homepage` | Patch pubs and/or events; omitted section preserved |
| GET | `/api/media/[...key]` | Access-checked file delivery |

---

## Localization approach

- Locales: `ar` (default), `en`.
- Cookie: `agenda_locale` (validated; invalid → `ar`).
- Server action `setLocaleAction` updates the cookie; the language switcher calls it then `router.refresh()` so the URL (including query + hash) stays the same.
- `lang` + `dir` set on `<html>` in the root layout from the cookie.
- **UI fallback:** missing dictionary → English → key.
- **Content fallback:** no silent DB fallback; missing locale translation → not found / empty.
- **Caching:** the root layout sets `instant = false` because cookie-driven `lang`/`dir` on `<html>` cannot be Suspense-wrapped; public chrome reads the cookie inside `<Suspense>`. Do not emit hreflang alternates for cookie-only variants. One visitor’s language must not be served from another’s cached HTML.
- **No** language query parameters or `localStorage` as the primary language source.

---

## Environment variables and setup

See `.env.example` and root `README.md`.

```bash
cp .env.example .env
# set DATABASE_URL

npm install
npx prisma generate
npx prisma migrate dev --name init   # apply current schema (incl. canonical slugs)
npm run dev
```

**If an older draft with per-translation slugs was already migrated:** write a forward migration that adds parent `slug`, backfills, drops translation `slug` columns — do not destroy production data without a backup. Phase 1 itself never applied migrations to a live database.

---

## Security boundaries

- Protected admin pages redirect to `/admin/login` when unauthenticated (DB configured); show unavailable without DB.
- Admin APIs call `requireAdminSession()` on every request (layout is not the sole boundary).
- Sessions: opaque cookie + hashed token in DB; logout revokes the row.
- Login/logout require trusted Origin; throttling is DB-backed.
- No fake session, hardcoded user, or localStorage auth flag.
- Content mutation endpoints remain 501 after auth.
- Secrets stay server-only; `.env` is gitignored. Bootstrap password must not appear in docs.

---

## Implemented vs placeholders

| Area | Status |
| --- | --- |
| Unprefixed routes + cookie locale | Functional |
| `/ar` prefix rewrite + `/en` / `?lang=` redirects | Functional |
| Bilingual shell, RTL/LTR | Functional |
| Public placeholder pages | Functional without DB |
| Featured/list services (read) | Functional when DB configured; empty otherwise |
| Public GET APIs | Functional (empty/404 without data) |
| Admin auth login/logout/sessions | Functional (requires migrated DB + admin user) |
| Admin shell after login | Functional |
| Admin content APIs / mutations | 501 after auth |
| Uploads, Markdown, PDF pipeline | Not implemented |

---

## Assumptions and unresolved decisions

1. **PostgreSQL + Prisma** chosen; PDF silent on database.
2. **Default locale = `ar`**; PDF silent on default.
3. Homepage publications catalogue uses the **same featured publication set** as the slider.
4. Storage vendor **unresolved**.
5. Markdown renderer **unresolved**.
6. Founders remain outside admin UI (§2.5).
