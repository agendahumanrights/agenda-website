# Agenda Website — Project Reference

> Technical reference for what currently exists in the Agenda website codebase, how it works, and what has changed.  
> **Source of truth:** application code. Requirements and older docs describe intended or planned behavior; this file describes verified implementation.  
> **Do not treat scaffolding as completed features.**

**Last updated:** 2026-11-11 (Arabic `/ar` path prefix)  
**Inspection basis:** Checked-in source under the repository root. DB migrate/admin bootstrap depend on local `.env` (gitignored).

---

## Table of contents

- [A. Project overview](#a-project-overview)
- [B. Detailed files and folders](#b-detailed-files-and-folders)
- [C. Pages and routing](#c-pages-and-routing)
- [D. Components and UI](#d-components-and-ui)
- [E. Database and Prisma](#e-database-and-prisma)
- [F. Backend implementation inside Next.js](#f-backend-implementation-inside-nextjs)
- [G. Feature behavior and workflows](#g-feature-behavior-and-workflows)
- [H. Arabic and English localization](#h-arabic-and-english-localization)
- [I. Configuration and local development](#i-configuration-and-local-development)
- [J. Verification, limitations, and next steps](#j-verification-limitations-and-next-steps)
- [K. Change history](#k-change-history)

---

## A. Project overview

### Purpose and scope

**Agenda** is the bilingual (Arabic / English) public website and admin foundation for [humanrightsagenda.org](https://humanrightsagenda.org). Intended scope (from `docs/WEBSITE_REQUIREMENTS.md`, mirrored from `Agenda Website.pdf` v1.1):

| Surface | Intended content |
| --- | --- |
| Public site | Home, publications catalogue + detail, events catalogue + detail, About Us |
| Admin dashboard | Login/logout, publications CRUD, events CRUD, homepage featured selection |
| Shared backend | Localized records, founder–blog author links, media/PDF storage, auth, homepage ordering |

### Public website and admin dashboard

| Surface | Current status (verified) |
| --- | --- |
| **Public website** | App Router pages render a bilingual shell (`/ar` or unmarked English). Pages call read services; without `DATABASE_URL` they show empty/placeholder states. |
| **Admin dashboard** | Auth + Publications + Events + **Founders** CRUD + homepage featured pubs/events (max 3). |

### Current development stage

**Publications, Events, and Founders modules complete** on Phase 1–2 foundation. Public brand UI covers header, hero slider, content cards, About Us, and **publication/event detail pages** (editorial layout, gallery, Markdown, share, PDF). **Cloudflare R2** object storage is implemented (`STORAGE_PROVIDER=r2`); local disk remains the default for development.

| Area | Status |
| --- | --- |
| Cookie + crawlable `/ar` prefix (English unmarked) + legacy `?lang=` / `/en` redirects | **Implemented** |
| Public page shells + RTL/LTR `lang`/`dir` | **Implemented** |
| Technical SEO (metadata, sitemap, robots, JSON-LD, OG/icons) | **Implemented** — see `SEO_IMPLEMENTATION.md` |
| Prisma schema + generated client output path | **Implemented** (schema checked in) |
| Public GET APIs + list/detail/homepage **read** services | **Implemented** (empty when DB unset; soft-fail on placeholder/bad URL) |
| Admin auth (login/logout/sessions/provisioning) | **Implemented** (Phase 2) |
| Publications admin CRUD, publish rules, uploads, Markdown | **Implemented** |
| Events admin CRUD, publish rules, uploads, Markdown | **Implemented** |
| Founders admin CRUD, reorder, About Us bios | **Implemented** (scope update vs original PDF §2.5) |
| Homepage featured publications + events (max 3) | **Implemented** (sectioned saves) |
| Migrations folder | **Present** (`20251018100000_init`, `20261107120000_add_youtube_url`, `20261107180000_publication_categories`) |

### Technology stack (versions from `package.json` / `package-lock.json`)

| Package | Locked version |
| --- | --- |
| `next` | 16.4.2 |
| `react` / `react-dom` | 19.3.0 |
| `typescript` | 5.9.3 |
| `tailwindcss` | 4.3.3 |
| `@prisma/client` / `prisma` | 7.10.1 |
| `@prisma/adapter-pg` | 7.10.1 |
| `pg` | 8.23.1 |
| `zod` | 4.6.7 |
| `dotenv` | 18.0.8 |
| `server-only` | 0.0.1 |
| `@aws-sdk/client-s3` | ^3.1165.0 (Cloudflare R2 via S3 API) |
| `eslint` / `eslint-config-next` | 9.39.5 / 16.4.2 |

Package manager: **npm** (`package-lock.json`). No separate Express server.

### Overall architecture

```
Browser
  │
  ├─ Cookie `agenda_locale` (ar|en)
  │
  ▼
Next.js 16 App Router (src/app)
  ├─ proxy.ts          → /ar rewrite + locale header; /en & ?lang= redirects; sync cookie
  ├─ Server Components → getRequestLocale → dictionaries / services
  ├─ Server Action     → setLocaleAction (language switcher)
  └─ Route Handlers    → src/app/api/** → Zod parse → services → Prisma
                              │
                              ▼
                     PostgreSQL (via Prisma 7 + @prisma/adapter-pg)
                              │
                     MediaAsset.storageKey → StorageProvider.getPublicUrl()
                     → agenda/* keys: R2_PUBLIC_BASE_URL; legacy keys: `/api/media/{key}`
```

- **Frontend:** React Server Components for pages; client components for language switcher, mobile nav, homepage slider, admin forms.
- **Backend:** Same Next.js process — Route Handlers + services under `src/server/**`. Server Components call services directly (no self-HTTP).
- **Database:** PostgreSQL assumed; Prisma schema in `prisma/schema.prisma`. Client generated to `src/generated/prisma` (gitignored; regenerated via `postinstall` / `prisma:generate`).
- **File storage:** `StorageProvider` with **local** (`STORAGE_PROVIDER=local`, `UPLOAD_DIR`) or **Cloudflare R2** (`STORAGE_PROVIDER=r2`, `R2_*` env). New uploads use `agenda/...` object keys. Legacy keys stay on access-checked `GET /api/media/[...key]` (local and/or R2). See `CLOUDFLARE_R2_STORAGE.md`.

---

## B. Detailed files and folders

### Exclusions

This tree and the explanations below cover **project-owned** source and config. Explicitly excluded from the detailed inventory:

- `node_modules/`
- `.next/`, `out/`, `build/`
- `.git/`
- `src/generated/prisma/` (generated Prisma client; listed as an output location only)
- Lockfile internals beyond noting `package-lock.json` exists

### Project tree (project-owned)

```
agenda/
├── .cursor/rules/
│   └── maintain-agenda-reference.mdc
├── .env.example
├── .gitignore
├── Agenda Website.pdf
├── AGENTS.md
├── agenda_website_reference.MD          ← this file
├── docs/
│   ├── IMPLEMENTATION_PLAN.md
│   ├── PROJECT_FOUNDATION.md
│   └── WEBSITE_REQUIREMENTS.md
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
├── prisma.config.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/ (init, youtube_url, publication_categories)
├── public/
│   ├── file.svg, globe.svg, next.svg, vercel.svg, window.svg
│   ├── web-app-manifest-192x192.png, web-app-manifest-512x512.png (PWA icons)
│   └── images/brand/agenda-logo.png (transparent cropped brand lockup)
├── README.md
├── tsconfig.json
└── src/
    ├── proxy.ts
    ├── app/
    │   ├── layout.tsx, globals.css, loading.tsx, error.tsx, not-found.tsx
    │   ├── (public)/ …
    │   ├── admin/ …
    │   └── api/ …
    ├── components/ …
    ├── content/about.ts
    ├── i18n/ …
    ├── lib/ …
    ├── messages/{ar,en}.json
    ├── server/ …
    └── types/ …
```

**Not present (verified):** seed scripts, `middleware.ts` (Next.js 16 uses `src/proxy.ts`), `vercel.json`, `Dockerfile`, `.github/` workflows. `.env` is gitignored (local secrets only).

### Root / docs / config

| Path | Purpose |
| --- | --- |
| `package.json` | Scripts and dependencies |
| `package-lock.json` | npm lockfile — use npm only |
| `tsconfig.json` | Strict TS; `@/*` → `./src/*` |
| `next.config.ts` | `cacheComponents`, `partialPrefetching`, Tailwind Turbopack CSS loader, `images.remotePatterns` from `R2_PUBLIC_BASE_URL` |
| `CLOUDFLARE_R2_STORAGE.md` | R2 architecture, env, migration, CORS, deployment checklist |
| `eslint.config.mjs` | `eslint-config-next` vitals + TS; ignores `src/generated/**` |
| `prisma.config.ts` | Prisma 7 config: schema path, migrations path, CLI datasource `DIRECT_URL` via `env()` |
| `prisma/schema.prisma` | Full data model (see §E) |
| `.env.example` | Safe env placeholders (see §I) |
| `.gitignore` | Ignores `.env`, `.next`, `node_modules`, `src/generated/prisma`, etc. |
| `AGENTS.md` | Next.js 16 agent notice: read `node_modules/next/dist/docs/` before coding |
| `README.md` | Setup and locale notes |
| `Agenda Website.pdf` | Requirements source (v1.1) |
| `docs/WEBSITE_REQUIREMENTS.md` | Readable mirror of PDF requirements |
| `docs/PROJECT_FOUNDATION.md` | Phase 1 architecture decisions |
| `docs/IMPLEMENTATION_PLAN.md` | Phased roadmap (auth → mutate → storage → UX → homepage admin → design) |
| `agenda_website_reference.MD` | This living technical reference |
| `.cursor/rules/maintain-agenda-reference.mdc` | Always-on Cursor rule to keep this reference current |

### `src/proxy.ts`

Next.js 16 **Proxy** (replaces deprecated `middleware`). Rewrites `/ar/...` to the unprefixed App Router tree and sets `x-agenda-lang` + `agenda_locale`. Redirects `/en/...` and legacy `?lang=` to the canonical English/Arabic URL shapes. Passes through `/api`, `/_next`, `/images`, and paths containing `.`. Exports `config.matcher`.

### `src/app` — entry points and global UI

| File | Responsibility |
| --- | --- |
| `layout.tsx` | Root layout: `getRequestLocale()` → `lang`/`dir`; fonts; site-wide metadata/icons/robots; `export const instant = false` |
| `sitemap.ts` / `robots.ts` | Dynamic sitemap + robots (SEO); see `SEO_IMPLEMENTATION.md` |
| `opengraph-image.tsx` | Branded 1200×630 social fallback |
| `globals.css` | Tailwind v4 import; brand + glass tokens (`--glass-*`); fixed header vars (`--site-header-height`, `--site-header-top-gap`, `--site-header-offset`); utilities `.public-main-offset`, `.hero-viewport`, `.anchor-offset` |
| `loading.tsx` | Renders `LoadingState` |
| `error.tsx` | Client error boundary (English hard-coded messages) |
| `not-found.tsx` | Bilingual 404 + link home |
| `favicon.ico` / `icon0.svg` / `icon1.png` / `apple-icon.png` | Browser / home-screen icons (file conventions) |
| `manifest.ts` | Web app manifest → maskable PNGs in `public/` |

**Route groups:** `(public)` and admin `(auth)` / `(protected)` do **not** appear in URLs.

### `src/app/(public)/`

| File | Role |
| --- | --- |
| `layout.tsx` | Suspense + `SiteHeader` / `main` / `SiteFooter` |
| `page.tsx` | Home: full-bleed featured pubs slider (outside `Container`), then catalogue / events / about teaser inside `Container` |
| `publications/page.tsx` | Publications catalogue with `PageHero` + live filters (`q`, `category`, `sort`, `page`) |
| `publications/[slug]/page.tsx` | Publication detail by canonical slug |
| `events/page.tsx` | Events catalogue with `PageHero` + live title search + date sort (`q`, `sort`, `page`) |
| `events/[slug]/page.tsx` | Event detail |
| `about/page.tsx` | About Us with `PageHero`; vision/mission/founders (anchors preserved) |

### `src/app/admin/`

| File | Role |
| --- | --- |
| `(auth)/login/page.tsx` | Functional bilingual `LoginForm`; redirects if already authenticated |
| `(protected)/layout.tsx` | Session required → redirect `/admin/login?next=…`; `AdminShell` (header + sidebar + mobile drawer) |
| `(protected)/page.tsx` | Dashboard welcome (authenticated) |
| `(protected)/publications/**` | List / new / edit — **implemented** |
| `(protected)/events/**` | List / new / edit — **implemented** |
| `(protected)/founders/**` | List / new / edit + reorder dialog — **implemented** |
| `(protected)/homepage/page.tsx` | Homepage selection — dual-panel curation UI |

### `src/app/api/`

Public GET list/detail for publications and events; admin routes call `requireAdminSession()` then `jsonNotImplemented` (practically always 401 today). See §F.

### `src/components/`

Organized by domain: `about/`, `admin/`, `events/`, `home/`, `layout/`, `publications/`, `shared/`, `ui/`. Details in §D.

### `src/server/`

| Folder | Role |
| --- | --- |
| `auth/` | Argon2id passwords, opaque sessions, CSRF, throttle, login/logout |
| `db/` | Lazy Prisma client + `isDatabaseConfigured()` |
| `http/` | `AppError`, JSON helpers, Zod parse helpers |
| `services/` | Publications, events, founders, homepage, media |
| `storage/` | `StorageProvider`; local + Cloudflare R2 adapters; key helpers; `MEDIA_LIMITS` (`maxImagesPerItem` default 10); content-image count helpers |
| `validations/` | Zod schemas (list queries usable; mutation schemas reserved) |

### `src/i18n/`, `src/messages/`, `src/content/`, `src/lib/`, `src/types/`

| Path | Role |
| --- | --- |
| `i18n/config.ts` | Re-exports locale helpers; documents UI vs content fallback |
| `i18n/locale-cookie.ts` | Cookie name/max-age/parse + `LOCALE_HEADER_NAME` |
| `i18n/get-locale.ts` | Server: `x-agenda-lang` header → cookie → English unmarked default |
| `lib/seo/*` | Site URL, locale hrefs, excerpts, metadata, JSON-LD builders |
| `i18n/get-dictionary.ts` | Load `messages/{locale}.json` |
| `i18n/dictionaries.ts` | `Dictionary` type from `en.json` |
| `i18n/pathnames.ts` | `sitePath`, `stripLocalePrefix`, deprecated `localizedPath` alias |
| `i18n/actions.ts` | Server Action `setLocaleAction` |
| `messages/ar.json`, `en.json` | UI chrome strings only |
| `content/about.ts` | Localized vision, mission, intro, homepage missionSummary (outside admin) |
| `lib/utils.ts` | `cn`, `clamp` |
| `lib/slugs.ts` | `slugify` helper (not wired into mutations yet) |
| `lib/catalogue-query.ts` | Parse/build public catalogue URL params (`q`, `category`, `sort=newest|oldest`, `page`); page size 12; default sort omitted from URLs |
| `lib/catalogue-summary.ts` | Results summary + chip label helpers |
| `content/page-heroes.ts` | Temporary hero image paths + `objectPosition` / `alt` for publications, events, about |
| `types/*` | Shared DTOs for publications, events, founders, API, locale |

### Placeholders / unused / incomplete (verified)

| Item | Evidence |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DEFAULT_LOCALE` | In `.env.example` / README; default locale is hard-coded `ar` in code |
| Default Next public SVGs | Stock assets under `public/`; not product imagery |
| `FounderCard` | Thin alias of `FounderBiography` (prefer the latter on About) |

---

## C. Pages and routing

### How folders map to URLs

- App Router under `src/app`.
- Route groups `(public)`, `(auth)`, `(protected)` are **omitted** from the path.
- **No** `[locale]` App Router segment. Arabic via `/ar` proxy rewrite; English unmarked; cookie for admin/UI.
- Dynamic segments: `[slug]` (public detail), `[id]` (admin edit — unreachable).
- Arabic `/ar/...` handled by `src/proxy.ts` (rewrite to unprefixed pages). `/en` and legacy `?lang=` redirect.

### Redirects / rewrites

| From | To | Behavior |
| --- | --- | --- |
| `/ar`, `/ar/...` | same URL in browser; internal `/`, `/...` | Rewrite + `x-agenda-lang=ar` + cookie |
| `/en`, `/en/...` | `/`, `/...` | Redirect + cookie `en` |
| `?lang=ar` | `/ar` + path | Redirect + cookie `ar` |
| `?lang=en` | unmarked path | Redirect + cookie `en` |

Other query params preserved. `/api` and static-like paths not rewritten.

### Public routes

#### `/` — `src/app/(public)/page.tsx`

| Aspect | Detail |
| --- | --- |
| Purpose | Home: branded header + full-bleed featured publications hero, publications catalogue, featured events, About teaser (`HomeAboutSection`) |
| Layout | Sticky glass header; full-bleed hero under header; shared full-width `Container` (padding only, no max-width) for Publications / Events / About; Events on subtle gray wash; editorial `SectionHeader` on Pubs/Events |
| Data | `getFeaturedPublications`, `getFeaturedEvents` (DB or `[]`); `getOrganizationCopy` (static nulls); dictionaries |
| Rendering | Async Server Component |
| Actions | Publication detail + blog author bio links; manual slider prev/next/dots/keyboard/swipe (client); nav links |
| States | Localized empty hero when no featured pubs; branded image fallback when media missing/fails |
| Auth | None |
| Status | Header + hero **implemented** (brand UI). Content depends on DB + featured rows. Catalogue reuses **same** featured publication list as slider. |

#### `/publications` — `src/app/(public)/publications/page.tsx`

| Aspect | Detail |
| --- | --- |
| Purpose | Catalogue of published publications |
| Data | `listPublishedPublications` with URL-derived `q`, `category`, `sort`, `page` (page size 12); server filters + sorts before pagination |
| Filters | Live toolbar: debounced title search (300ms; clear immediate) **AND** immediate category **AND** Sort by Date (`newest` default / `oldest`); Enter applies now; Reset when search/category/non-default sort active; no Apply button |
| URL | Applied truth: `q`, `category` (category **slug**, seeded `REPORT`/`BLOG`/`PAPER`/`BRIEFING` plus new slugs), `sort` (omit when `newest`), `page` (omit defaults/empty); typing uses `router.replace` (no history spam) |
| Feedback | Results summary, removable chips, Clear all; empty catalogue vs no matches vs DB unavailable/error |
| Pagination | Link-based `Pagination`; preserves filters + sort; hidden when ≤1 page; out-of-range pages clamped |
| Auth | None |
| Status | **Implemented** (content depends on DB) |

#### `/publications/[slug]` — `src/app/(public)/publications/[slug]/page.tsx`

| Aspect | Detail |
| --- | --- |
| Purpose | Publication detail |
| Data | `getPublishedPublicationBySlug`; without DB → `EmptyState` placeholder; missing row/translation → `notFound()` |
| UI | Editorial `PublicationDetails`: breadcrumbs, category/date, title/subtitle, blog author (portrait + area + bio link), share controls, `MediaGallery`, optional YouTube embed, Markdown, PDF actions |
| Auth | None |
| Status | **Implemented** (content depends on DB + published locale translation) |

#### `/events` — `src/app/(public)/events/page.tsx`

| Aspect | Detail |
| --- | --- |
| Purpose | Events catalogue |
| Data | `listPublishedEvents` with URL-derived `q`, `sort`, `page` (page size 12); title search on current locale; order by admin `eventDate` |
| Filters | Live title search (300ms debounce; clear immediate; Enter applies now) **AND** Sort by Date (`newest`/`oldest`); Reset when search or non-default sort active; no Apply button; no public creation-date controls |
| URL | Applied truth: `q`, `sort` (omit when `newest`), `page` — legacy `createdFrom`/`createdTo` ignored; typing uses `router.replace` |
| Feedback | Results summary, search chip, Clear all; empty / no matches / unavailable / error |
| Pagination | Same link-based pattern as publications (preserves sort) |
| Auth | None |
| Status | **Implemented** (content depends on DB). API/admin still support `createdFrom`/`createdTo` for other consumers |

#### `/events/[slug]` — `src/app/(public)/events/[slug]/page.tsx`

| Aspect | Detail |
| --- | --- |
| Purpose | Event detail |
| Data | `getPublishedEventBySlug`; same DB/empty/notFound pattern as publications |
| UI | Editorial `EventDetails`: breadcrumbs, Event label + `eventDate`, title/subtitle, share controls, `MediaGallery`, optional YouTube embed, Markdown (no PDF) |
| Auth | None |
| Status | **Implemented** (content depends on DB) |

#### `/about` — `src/app/(public)/about/page.tsx`

| Aspect | Detail |
| --- | --- |
| Purpose | Organization intro, vision, mission, founders |
| Data | `getOrganizationCopy(locale)` from `content/about.ts`; `listFounderBiographies(locale)` (DB or `[]`) |
| UI | `PageHero` + vision/mission blocks; founders: `AccentHeading` + alternating circular-portrait / soft panel rows (`id=founder-{bioKey}`, `.anchor-offset`); single founder centered |
| Auth | None |
| Status | **Implemented** (org copy static; founders depend on admin/DB rows) |

### Admin routes

All `(protected)/**` pages are blocked by layout: visitor always sees `AdminUnavailable`. Child pages are **scaffold only** and currently unreachable.

| URL | Source | Visible behavior today |
| --- | --- | --- |
| `/admin/login` | `(auth)/login/page.tsx` | Bilingual login form; Origin CSRF via API |
| `/admin` | `(protected)/page.tsx` | Unavailable (layout) |
| `/admin/publications` | `publications/page.tsx` | Unavailable |
| `/admin/publications/new` | `publications/new/page.tsx` | Unavailable |
| `/admin/publications/[id]/edit` | `publications/[id]/edit/page.tsx` | Unavailable |
| `/admin/events` (+ `/new`, `/[id]/edit`) | corresponding pages | Unavailable |
| `/admin/homepage` | `homepage/page.tsx` | Unavailable |

No logout route or working login form exists.

### Global loading / error / not-found

| File | Behavior |
| --- | --- |
| `src/app/loading.tsx` | Generic loading text |
| `src/app/error.tsx` | Client reset; English copy |
| `src/app/not-found.tsx` | EN/AR short message + home link |
| Public layout Suspense | Falls back to `LoadingState` while chrome resolves locale |

---

## D. Components and UI

### Styling, theme, fonts, responsive, RTL

- **Styling:** Tailwind CSS v4 via `@import "tailwindcss"` in `globals.css`; utility classes in components.
- **Theme / brand:** Brand blue `#05498C` plus shared glass tokens (`--glass-tint`, 20px blur, border/highlight/shadow, opaque fallback). Fixed header spacing via `--site-header-height` / `--site-header-offset`. Public chrome uses glass; page bodies still largely zinc/white.
- **Fonts:** `next/font/google` on `<html>`: **Geist** / **Geist Mono** (UI), **Source Serif 4** (editorial titles via `.font-editorial`), **Noto Sans Arabic** (Arabic coverage). Stack: sans → Geist + Noto Arabic; serif → Source Serif + Noto Arabic.
- **Responsive:** Desktop footer 3-column glass panel; mobile stacks with horizontal separators and horizontal social icons. Desktop nav from `md:`. Heroes are full viewport under a **fixed** transparent header (no negative-margin pull; clearance via padding / `.public-main-offset`).
- **RTL/LTR:** `dir` on `<html>` from locale (`ar` → `rtl`, `en` → `ltr`). Hero gradient and slider arrows use logical/`dir`-aware placement. Logical `border-e` used in `AdminSidebar`.

### Layout / navigation

| Component | Notes |
| --- | --- |
| `Container` | Full-width padded wrapper (`px-4 sm:px-6 lg:px-8`, no max-width) for below-hero home sections + other public pages |
| `SiteHeader` | **Fixed** transparent overlay (`fixed inset-x-0 top-0`); full-width glass capsule ~16px from top. No in-flow white band. Heroes/detail pages extend behind it; clearance via padding / `.public-main-offset`. Logo · pill nav · language · mobile menu. |
| `PageHero` | Full-bleed navy→brand-blue intro from viewport top; internal top padding clears fixed header; content row matches `Container` padding (no max-width); breadcrumbs; 4:3 framed image; curved content transition |
| `SiteFooter` | Full-width glass rounded panel over blue/gray wash: brand + mission summary · two link columns · circular social icons (Facebook/LinkedIn/YouTube) · copyright row. No newsletter. |
| `MainNavigation` | Pill links with brighter active glass surface |
| `MobileNavigation` | Glass panel under fixed header; Escape/focus trap/overlay preserved |
| `nav-items.ts` | Shared nav href/label helpers + active-path matching |
| `MainNavigation` | Client: Home / Publications / Events / About; active page uses brand blue underline (`aria-current`) |
| `MobileNavigation` | Client hamburger + overlay panel; Escape closes; focus moves into panel / returns to button; body scroll lock |
| `LanguageSwitcher` | Client: `EN \| AR` style; `setLocaleAction` + `router.refresh()`; keeps path/query/hash |

### Shared content cards

| Component | Status |
| --- | --- |
| `ContentCard` | Compact 4:3 card (`rounded-xl` ~12px): badge inset on image; blue panel order title → excerpt → optional “By/بقلم” author → bottom row (date start + Read more end with arrow). Desktop reserves 2-line title / 3-line excerpt for row alignment; hover lift; no whole-card link. |
| `CardMedia` | Client: lazy `<img>` with `object-cover`, branded gradient fallback when URL missing/fails; restrained hover zoom via `.card-media-image` (disabled under `prefers-reduced-motion`). |

### Home

| Component | Status |
| --- | --- |
| `FeaturedPublicationsSlider` | **Implemented** full-bleed hero: category, title, subtitle, locale date, blog `AuthorLink`, “Read more” CTA. Manual only (arrows, dots, keyboard when focused, horizontal swipe). No autoplay. Hides controls for a single slide. Localized empty state; branded fallback when image missing/fails. Eager-loads only the first slide image; others load when selected. Respects `prefers-reduced-motion`. |
| `SectionHeader` | Shared editorial header: blue pill label + large heading (inline-start); description + outlined action (inline-end); stacks on mobile; RTL-aware |
| `HomeFeaturedGrid` | Homepage featured row: same full-width 1/2/3-col grid as listing pages (no centered max-width gutters) |
| `PublicationGrid` | 1/2/3-col grid or `variant="home"` via `HomeFeaturedGrid`; EmptyState when empty |
| `FeaturedEventsSection` | `SectionHeader` + home `EventGrid` (max three featured from homepage selection) |

### Publications

| Component | Status |
| --- | --- |
| `PublicationCard` | Uses `ContentCard`; localized category badge (no forced uppercase); `publishedAt`; blog author with `authorBy` + bio link; subtitle as excerpt |
| `PublicationCategoryBadge` | Localized category label (list cards / legacy) |
| `AuthorLink` | `/about#founder-{bioKey}` |
| `PublicationAuthor` | Circular portrait, name link, professional area (blogs) |
| `PublicationDetails` | Editorial layout: breadcrumbs → meta → title/subtitle → author → share (+ PDF actions) → gallery → optional YouTube → Markdown |
| `PublicationPdfActions` | Client: View PDF (new tab) + Download PDF under share controls; no iframe preview. Download fetches `/api/media/...?download=1` as a blob |
| `PdfPreview` / `PdfDownloadLink` | Legacy helpers (unused on public detail page after PDF action move) |
| `PublicationFilters` | **Implemented** live search + category + date sort (debounced `q`, immediate category/sort, Reset); URL replace; IME-safe |

### Events

| Component | Status |
| --- | --- |
| `EventCard` / `EventGrid` | `ContentCard` with localized “Event / فعالية” badge; visitor-facing `eventDate` (not `createdAt`); subtitle as excerpt; 1/2/3-col grid |
| `EventDetails` | Same editorial pattern as publications (no author/PDF); uses `eventDate`; optional YouTube between gallery and Markdown |
| `EventDateFilter` | **Implemented** live title search + Sort by Date (`eventDate`) + Reset (debounced; no public creation-date fields) |
| `CatalogueLiveProvider` / `CatalogueResultsFrame` | Soft-nav pending indicator; keeps prior results visible while updating |

### Detail shared UI

| Component | Status |
| --- | --- |
| `Breadcrumbs` | Localized Home → section → current title |
| `ShareControls` | Client expandable share menu: circular trigger + white pill (pointer, separators) with X, Facebook, LinkedIn, email, copy link; outside/Escape close; RTL/LTR; copy feedback; `aria-expanded` / `aria-controls` |
| `MediaGallery` | Client: main+gallery images (deduped by media id); frame uses full-bleed `object-cover` (lightbox keeps `object-contain`); centered thumb row (`w-max min-w-full justify-center`) with horizontal scroll when needed; prev/next, counter, fullscreen, keyboard/swipe, RTL-aware; omits when empty |
| `YouTubeEmbed` | Shared responsive 16:9 iframe via `youtube-nocookie.com` from validated video ID; optional heading; lazy by default; omits when URL invalid |
| `YouTubeUrlField` | Admin Media-card control: URL input (LTR), live preview, remove; used by Publication/Event forms |
| `ArticleMarkdown` / `MarkdownContent` | Shared safe GFM renderer (sanitize, external links, heading shift); `.article-prose` typography for public details + admin preview |
| `MarkdownEditor` | Admin toolbar editor (Write/Preview/Split, expand, help, undo/redo); used by Publication + Event AR/EN description fields |
| `lib/markdown-editor.ts` | Pure Markdown textarea transforms + `markdownToPlainText` for excerpts |
| `buildDetailImages` | Server helper: main first, gallery append, skip duplicate media ids, localized alt |

### About

| Component | Status |
| --- | --- |
| `HomeAboutSection` | Teaser using shared section label/title/action styles; vision + mission summary; official logo (`/images/agenda-logo.png`) in the white panel |
| `OrganizationIntro` | About page vision + mission via `AboutContentBlock` (mission column reversed on desktop) |
| `AboutContentBlock` / `IllustrationPanel` / `AccentHeading` | Shared two-column layout, white illustration card with decorative circles, blue vertical accent |
| `AboutIllustrations` | Lightweight brand-blue SVGs (vision target, mission document/check, inclusion figures) |
| `FounderBiography` | Alternating desktop rows: large circular portrait + soft rounded bio panel (name → role → full biography → labeled email); mobile stacks portrait above panel; `id=founder-{bioKey}`; `.anchor-offset` for fixed header |
| `FounderProfileImage` | Circular portrait (`object-cover object-top`) with soft blue ring; person-silhouette fallback when missing/failed |
| `FounderCard` | Alias → `FounderBiography` (compat) |

### Admin

| Component | Status |
| --- | --- |
| `AdminShell` | Authenticated chrome: sticky header, desktop sidebar, mobile drawer; scoped `.admin-shell` styles |
| `AdminHeader` | Logo, org title, signed-in account, language switcher, sign-out, mobile menu toggle |
| `AdminSidebar` | Full-height nav with icons + blue active state |
| `AdminPageHeader` | Title/description helper |
| `AdminConfirmDialog` / `AdminOverflowMenu` | Accessible confirm + overflow actions |
| `MediaDropzone` | Click + drag-and-drop upload surface; optional `multiple` / `onFiles` for gallery batches |
| `PublicationForm` | Two-column New/Edit: AR/EN content tabs, DB category dropdown + Add category modal, media panel with live `{n} / 10` image counter, sticky publishing actions |
| `AddCategoryModal` / `CategoriesTable` | Create bilingual categories from the form or `/admin/publications/categories` |
| `PublicationsTable` | Debounced search, filters, desktop table + mobile cards, overflow delete/view |
| `EventForm` / `EventsTable` | **Redesigned** to match Publications (list filters/table/cards; two-column form + tabs + media with same 10-image counter/cap + publish) |
| `FounderForm` / `FoundersTable` | **Redesigned** to match admin chrome: debounced name search, founder cards/table, overflow View/Delete, reorder dialog (DnD + keyboard, complete ID list), two-column form with AR/EN tabs, circular MediaDropzone portrait, sticky actions |
| `HomepageSelection` | **Redesigned** dual-panel curation: selected cards (thumb, order, DnD + keyboard move, remove), available browser with bilingual title search + load-more, independent dirty/save/reset per section, brand-blue saves, accurate empty/error states, beforeunload when unsaved |

### Shared UI

| Component | Notes |
| --- | --- |
| `Button`, `Input`, `Select`, `Textarea`, `FormField` | Basic primitives |
| `PageHeading`, `EmptyState`, `ErrorState`, `LoadingState` | Status/chrome |
| `Pagination` | Link-based prev/next; used by public publications/events catalogues |
| `catalogue/CatalogueToolbar` | Shared filter shell (neutral panel, control heights, brand focus) |
| `catalogue/CatalogueResultsBar` | Results summary (`aria-live`) + removable chips + Clear all |
| `catalogue/CatalogueEmpty` | Empty/no-match/unavailable/error with optional clear/retry links |
| `AdminUnavailable` | Fail-closed admin message |

### Markdown / PDF / galleries

| Requirement area | Implementation |
| --- | --- |
| Markdown editor | Shared admin `MarkdownEditor`: toolbar (headings, emphasis, lists, tasks, quotes, links, images, code, tables, HR, undo/redo), Write / Preview / Split, expand + help; stores Markdown strings |
| Markdown renderer | Shared `MarkdownContent` + `ArticleMarkdown` (GFM, sanitize, safe http(s)/mailto, heading shift, `.article-prose`) for admin preview and public details |
| PDF view/download | `PublicationPdfActions` under share controls; `GET /api/media/...?download=1` forces attachment |
| Image galleries | `MediaGallery` on publication/event details (main + gallery, lightbox) |

---

## E. Database and Prisma

### Provider and setup

- **Provider:** PostgreSQL (`datasource db { provider = "postgresql" }` — no `url`/`directUrl` in schema; Prisma 7).
- **CLI datasource:** `prisma.config.ts` uses `DIRECT_URL` (Supabase session pooler / direct, port 5432) for migrate and other Prisma CLI commands.
- **Runtime datasource:** `src/server/db/client.ts` uses `DATABASE_URL` (Supabase transaction pooler, port 6543, `pgbouncer=true`) via `@prisma/adapter-pg`.
- **Client:** `generator` outputs to `../src/generated/prisma`.
- **Migrations directory:** `prisma/migrations` (`20251018100000_init`, `20261107120000_add_youtube_url`, `20261107180000_publication_categories`).
- **Seed scripts:** **None**.
- **Verified DB state:** Local `.env` points at Supabase shared pooler (`aws-0-ap-northeast-2`). Migrations applied with `npx prisma migrate deploy` (see change history).

### Enums

| Enum | Values |
| --- | --- |
| `Locale` | `ar`, `en` |
| `PublicationCategory` | `REPORT`, `BLOG`, `PAPER`, `BRIEFING` |
| `PublicationStatus` | `DRAFT`, `PUBLISHED` |
| `EventStatus` | `DRAFT`, `PUBLISHED` |
| `MediaKind` | `IMAGE`, `PDF`, `OTHER` |

### Models (fields and constraints)

#### `AdminUser` / `AdminSession` / `LoginThrottle`

- **AdminUser:** `email` (unique), `passwordHash` (Argon2id), optional `name`, `sessions`.
- **AdminSession:** `tokenHash` (unique SHA-256 of cookie token), `expiresAt` (7-day TTL), `revokedAt?`, cascade delete with user.
- **LoginThrottle:** `key` (`email:…` / `ip:…`), `failedCount`, `windowStartedAt`, `blockedUntil?` — 5 failures / 15 minutes.

#### `AdminUser` (fields)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String cuid PK | |
| `email` | String **unique** | |
| `passwordHash` | String | Auth not implemented |
| `name` | String? | |
| `createdAt` / `updatedAt` | DateTime | default now / `@updatedAt` |

#### `Founder`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | String cuid PK | |
| `bioKey` | String **unique** | Deep link key → `/about#founder-{bioKey}` |
| `email` | String? | |
| `sortOrder` | Int default 0 | |
| `profileImageId` | String? **unique** FK → `MediaAsset` | `onDelete: SetNull` |
| timestamps | | |

Relations: `translations`, `publications` (as blog authors).

#### `FounderTranslation`

| Field | Notes |
| --- | --- |
| `founderId` + `locale` | **@@unique**; cascade delete with founder |
| `fullName`, `biography` (Text), `professionalArea` | Localized |
| Index | `[locale]` |

#### `PublicationCategory`

Admin-managed bilingual categories (replaces former Prisma enum).

| Field | Notes |
| --- | --- |
| `slug` | unique filter key; seeded `REPORT`/`BLOG`/`PAPER`/`BRIEFING` preserve public `?category=` URLs |
| `nameEn` / `nameAr` | unique display names |
| `requiresAuthor` | when true, publications need a founder author (seeded for `BLOG`) |
| `sortOrder` | dropdown/table ordering |

#### `Publication`

| Field | Notes |
| --- | --- |
| `slug` | String **unique** — canonical public URL segment |
| `categoryId` | FK → `PublicationCategory` `onDelete: Restrict` |
| `status` | default `DRAFT` |
| `publishedAt` | DateTime? — visitor-facing date |
| `authorFounderId` | String? FK Founder `onDelete: Restrict` — **service rule:** required when category.`requiresAuthor`, null otherwise |
| `mainImageId` | FK MediaAsset SetNull |
| `pdfId` | String? **unique** FK MediaAsset SetNull |
| `youtubeUrl` | String? — optional canonical YouTube watch URL (not counted toward image limits) |
| Indexes | `[status, publishedAt]`, `[categoryId, status]`, `[authorFounderId]` |

Relations: category, translations, gallery, optional `FeaturedPublication`.

#### `PublicationTranslation`

`title`, `subtitle`, `description` (Text, Markdown-intended); **@@unique([publicationId, locale])**; index `[locale, title]`; cascade on publication delete.

#### `PublicationGalleryImage`

`publicationId` + `mediaAssetId` **unique**; `sortOrder`; cascade; index `[publicationId, sortOrder]`.

#### `Event`

| Field | Notes |
| --- | --- |
| `slug` | unique canonical |
| `status` | default `DRAFT` |
| `eventDate` | occurrence date (visitor display) |
| `createdAt` | record creation — **intended public filter field** |
| `mainImageId` | optional SetNull |
| `youtubeUrl` | String? — optional canonical YouTube watch URL (same rules as publications) |
| Indexes | `[status, eventDate]`, `[createdAt]` |

#### `EventTranslation` / `EventGalleryImage`

Analogous to publication translation/gallery patterns.

#### `MediaAsset`

`storageKey` unique; `filename`, `mimeType`, `sizeBytes`; `kind` default `OTHER`; alt texts via `MediaAltText` (**@@unique([mediaAssetId, locale])**).

#### `FeaturedPublication` / `FeaturedEvent`

Homepage manual selection: `publicationId` / `eventId` **unique**; `sortOrder` indexed; cascade delete with parent. **Max 3 events** is **not** a DB constraint — service/Zod only.

### Relationship diagram (readable)

```
AdminUser

Founder 1──* FounderTranslation
Founder 1──0..1 MediaAsset (profile)
Founder 1──* Publication (author)

PublicationCategory 1──* Publication
Publication 1──* PublicationTranslation
Publication *──0..1 MediaAsset (main)
Publication 0..1──0..1 MediaAsset (pdf)
Publication 1──* PublicationGalleryImage *──1 MediaAsset
Publication 0..1──0..1 FeaturedPublication

Event 1──* EventTranslation
Event *──0..1 MediaAsset (main)
Event 1──* EventGalleryImage *──1 MediaAsset
Event 0..1──0..1 FeaturedEvent

MediaAsset 1──* MediaAltText
```

### Business rules: DB vs application

| Rule | Enforcement |
| --- | --- |
| Unique slugs, FKs, cascades, unique featured parent ids | **Prisma / DB** |
| Public reads only `PUBLISHED` | **Service** (+ public API) |
| Blog requires founder; non-blog must not | Documented for **service** (mutations not implemented) |
| Both `ar`+`en` before publish | Documented for **service** (not implemented) |
| Max 3 featured events | Zod `max(3)` + service + admin UI (disable Add at 3) |
| Featured items must be published | Service eligibility checks; conflict if deleted/unpublished since page load |

### Prisma client usage

- Import path: `@/generated/prisma` / `@/server/db`.
- Guard: `isDatabaseConfigured()` → `Boolean(process.env.DATABASE_URL)`.
- List/detail/homepage/founder **reads** short-circuit to empty / notFound when unset.

---

## F. Backend implementation inside Next.js

### Organization

```
Route Handler / Server Component / Server Action
  → Zod validation (where applicable)
  → requireAdminSession (admin only)
  → service (src/server/services/*)
  → getPrisma() / getStorage()
```

**No** separate repositories layer. **No** Server Actions for CRUD (only `setLocaleAction`). **No** external SaaS integrations wired.

### HTTP conventions (`src/server/http/`)

| Helper | Behavior |
| --- | --- |
| `jsonOk` / `jsonCreated` | 200 / 201 JSON |
| `jsonError` | Maps `AppError` → `{ error: { code, message, details? } }`; else 500 `INTERNAL_ERROR` |
| `jsonNotImplemented` | 501 `NOT_IMPLEMENTED` |
| `parseWithSchema` / `parseSearchParams` / `parseJsonBody` | Zod → 400 `BAD_REQUEST` with issue list |

`AppError` codes used: `NOT_IMPLEMENTED`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `CONFLICT`, `TOO_MANY_REQUESTS`, `SERVICE_UNAVAILABLE`.

### Authentication (Phase 2)

| Function | Behavior |
| --- | --- |
| `getAdminSession()` | Reads HttpOnly cookie; looks up `AdminSession` by token hash; requires non-revoked, non-expired, existing `AdminUser` |
| `requireAdminSession()` | Returns `AdminSession` or throws 401 / 503 |
| `loginAdministrator` | CSRF (caller), throttle, Argon2 verify, create session + cookie |
| `logoutAdministrator` | Revoke row + clear cookie |
| `npm run admin:create` | Creates bootstrap admin from env; no-op password change if exists |

Cookie: `ADMIN_SESSION_COOKIE_NAME` (default `agenda_admin_session`), HttpOnly, SameSite=Lax, Path=/, Secure in production, 7-day maxAge.

Endpoints: `POST /api/admin/auth/login`, `POST /api/admin/auth/logout`.

### Caching / revalidation

- Root layout `instant = false` for cookie `lang`/`dir`.
- `setLocaleAction` calls `revalidatePath("/", "layout")`.
- Public pages use `cookies()` via `getRequestLocale` (dynamic). No `revalidateTag` content cache strategy yet.

### Storage

- `STORAGE_PROVIDER=local` (default): `LocalFilesystemStorage` under `UPLOAD_DIR`.
- `STORAGE_PROVIDER=r2`: `CloudflareR2Storage` (`@aws-sdk/client-s3`); fails closed if `R2_*` missing (no silent local fallback for new uploads).
- `STORAGE_PROVIDER=unimplemented` / `none`: `UnimplementedStorage` — `upload`/`delete` → 501.
- Public URLs: `agenda/*` → `R2_PUBLIC_BASE_URL`; legacy keys → `/api/media/...`.
- CLI: `npm run media:test-r2`, `npm run media:migrate-r2` (dry-run by default).

### Public API endpoints

#### `GET /api/publications` — `src/app/api/publications/route.ts`

| | |
| --- | --- |
| Purpose | Paginated published publications |
| Inputs | Query: `locale` (default cookie), `page`, `pageSize`, `q`, `category` via `publicPublicationListQuerySchema` |
| Auth | None |
| Output | `{ items, pagination }` |
| Errors | 400 validation; 500 unexpected |
| DB | `listPublishedPublications` |

#### `POST /api/publications`

501 “Public publication create”.

#### `GET /api/publications/[slug]`

| | |
| --- | --- |
| Inputs | Path `slug`; `locale` query or cookie |
| Output | `PublicationDetail` |
| Errors | 404 if missing/unpublished/no translation; 400 validation |

#### `GET /api/events` / `GET /api/events/[slug]`

Analogous; list supports `createdFrom` / `createdTo` (creation date) and `q`.

#### `POST /api/events`

501.

### Admin API endpoints

Auth:

- `POST /api/admin/auth/login` — Origin CSRF, throttle, Zod, session cookie
- `POST /api/admin/auth/logout` — Origin CSRF, revoke session

Content (still unimplemented after auth):

- `/api/admin/publications` (GET list, POST create) — session + CSRF on mutations
- `/api/admin/publications/[id]` (GET, PATCH, DELETE)
- `/api/admin/events` (GET list, POST create)
- `/api/admin/events/[id]` (GET, PATCH, DELETE)
- `/api/admin/founders` (GET list, POST create)
- `/api/admin/founders/[id]` (GET, PATCH, DELETE)
- `/api/admin/founders/reorder` (PUT complete ordered IDs)
- `/api/admin/media/upload` (POST multipart; publication + event + founder purposes)
- `/api/admin/homepage` (GET both sections; PUT patch — omitted section preserved)
- `/api/media/[...key]` (GET access-checked file delivery)
- `/api/admin/events` (GET, POST)
- `/api/admin/events/[id]` (GET, PATCH, DELETE)
- `/api/admin/homepage` (GET, PUT)

**Flow:** `requireAdminSession()` first → **401** if unauthenticated; **501** via `jsonNotImplemented` when authenticated. No content DB writes yet.

### Server Actions

| Action | File | Purpose |
| --- | --- | --- |
| `setLocaleAction(locale)` | `src/i18n/actions.ts` | Validate locale; set cookie; revalidate layout |

### Services summary

| Service | Implemented | Stub / 501 |
| --- | --- | --- |
| `publications` | list + getBySlug (published) | create/update/delete/listAdmin |
| `events` | list + getBySlug (published); creation-date filter in query | create/update/delete/listAdmin |
| `homepage` | getFeaturedPublications/Events; admin selection state (titles AR/EN, category, dates); sectioned `setFeaturedPublications` / `setFeaturedEvents` / patch | — |
| `founders` | list/get/create/update/delete; `listAllAdminFoundersOrdered`; reorder (complete IDs); About bios | — |
| `media` | upload (MIME sniff), access checks, orphan delete, `resolvePublicMediaUrl` | — |

### Layers still thin / not production-complete

- Seed / content import CLI
- Email / analytics
- Markdown pipeline: **implemented** (`MarkdownEditor` + `MarkdownContent` / `ArticleMarkdown`, GFM + sanitize)
- Production R2: code ready; requires host env + optional local→R2 migration of existing files

---

## G. Feature behavior and workflows

### Publications and categories

**Read path (when `DATABASE_URL` set and data exists):**  
Page/API → Zod (API) → `listPublishedPublications` / `getPublishedPublicationBySlug` → Prisma `status: PUBLISHED` + locale translation → map URLs via storage → UI.

Categories are enum values; UI labels from dictionaries. Public catalogue and API both support `category` filtering (`REPORT` / `BLOG` / `PAPER` / `BRIEFING`).

### Publication details

Reading order: breadcrumbs → category + `publishedAt` → title → subtitle → blog author (image/area/`AuthorLink`) → share + optional PDF actions → `MediaGallery` → optional `YouTubeEmbed` → Markdown. DTO includes `images[]`, `youtubeUrl`, `authorImageUrl`, `authorProfessionalArea` (main+gallery alt texts; founder profile via relation). Markdown uses sanitized `ArticleMarkdown` below gallery/video. No embedded PDF iframe.

### Events and event details

Same editorial pattern without author/PDF. Visitor-facing date is `eventDate`. Public Events page searches by title only; `GET /api/events` and admin list still support `createdAt` range (`createdFrom`/`createdTo`, inclusive UTC days).

### Founders / authors / biographies

- Schema links `Publication.authorFounderId` → `Founder` (`onDelete: Restrict`); admin delete returns 409 with publication count when linked.
- List/detail map `authorName` / `authorBioKey` from founder translation.
- `AuthorLink` → `/about#founder-{bioKey}`; `FounderBiography` sets matching `id` with `scroll-mt` under the site header. Immutable `bioKey` after create.
- About lists founders via `listFounderBiographies` in admin `sortOrder`; biographies are plain text with preserved paragraph breaks (not Markdown). Empty list → localized EmptyState.
- Admin reorder requires the **complete** ordered ID list (`listAllAdminFoundersOrdered` / `GET ?forOrder=1`); profile image required on create/update (Replace only, no clear).
- Org vision/mission/intro/missionSummary from `src/content/about.ts` (outside admin), localized `en`/`ar`.

### Homepage selections and ordering

- Reads `FeaturedPublication` / `FeaturedEvent` ordered by `sortOrder`.
- Featured events query `take: 3`; writes reject more than 3 and non-published / missing IDs (409 with actionable messages).
- Filters to published + having locale translation.
- Home publications catalogue uses **the same featured publications array** as the slider (not a separate selection).
- Admin `/admin/homepage`: two independent panels (publications unlimited; events max 3). Local add/remove/reorder until Save; Reset restores last saved; empty save clears featured rows and homepage shows empty states. Revalidates publication/event paths on save.

### Admin login/logout and protection

- Login page: informational only.
- Protected layout: never authenticated → always `AdminUnavailable`.
- No logout.

### Images / uploads / Markdown / PDF

- Uploads via admin media API + `StorageProvider` (`local` or Cloudflare `r2`). New R2 keys under `agenda/{publications|events|founders}/...`. Legacy keys served by `GET /api/media/[...key]` (access-checked; can read local leftover files when R2 is active).
- **Image cap (publications & events):** `MEDIA_LIMITS.maxImagesPerItem` default **10** total (1 main + up to 9 gallery), overridable via `UPLOAD_MAX_IMAGES_PER_ITEM`. Enforced in Zod create schemas, publication/event services (`assertContentImageCountAllowed`), and admin forms (counter, disable upload at limit, reject multi-select over remaining capacity). Existing over-limit records are grandfathered: saves may keep or reduce count, never auto-delete media, and cannot add more until under the cap. Replacing the main image does not change the count.
- **YouTube (optional, one per item):** nullable `youtubeUrl` on Publication and Event. Shared `src/lib/youtube.ts` parses watch/youtu.be/embed/shorts (+ query params), normalizes to canonical watch URL, embeds via `youtube-nocookie.com`. Zod `optionalYoutubeUrlSchema` + admin `YouTubeUrlField` + public `YouTubeEmbed` (gallery → video → Markdown). Does **not** count toward the image cap; no video file storage.
- Detail galleries use structured `images` with localized alt; list cards use cover `<img>`. Public `MediaGallery` unchanged (works with 1–10+ images).
- Markdown: shared toolbar editor in admin; sanitized GFM for admin preview and public detail bodies (same `.article-prose` styles).
- Publication PDF: View/Download buttons under share controls; same-origin media route supports `?download=1`; cross-origin R2 public URLs need bucket CORS GET (see `CLOUDFLARE_R2_STORAGE.md`).

### Search and filtering

| Surface | UI | Backend |
| --- | --- | --- |
| Publications search/category/sort | Live debounced search + immediate category + date sort; URL `q` + `category` + `sort` + `page`; AND logic | `listPublishedPublications` orders by admin `publishedAt` (`newest`/`oldest`, nulls last) then `id`; `GET /api/publications` |
| Events title search/sort | Live debounced search + date sort; URL `q` + `sort` + `page` (`createdFrom`/`createdTo` ignored on page) | `listPublishedEvents` orders by admin `eventDate` then `id`; API still accepts optional `createdFrom`/`createdTo` |
| Pagination | Link `Pagination` on both catalogues; page size 12; preserves filters + sort | Sort applied to full filtered set before skip/take; `id` tie-breaker |

### Requirements checklist (intended vs code)

| Requirement | Verdict |
| --- | --- |
| Manual slider navigation | **Supported** in `FeaturedPublicationsSlider` (arrows, dots, keyboard, swipe; no autoplay) |
| Manually selected homepage content | **Implemented** (admin homepage selection + public reads) |
| Max three featured homepage events | **Zod + service read `take: 3` + write validation** |
| Event filter by record creation date (≠ event date) | **Service/API + admin yes**; **public Events page no** (title search only; cards show `eventDate`) |
| Founders as blog authors | **Implemented** (admin assignment + `AuthorLink` to `#founder-{bioKey}`) |
| About Us org copy outside admin | **Followed** (`content/about.ts`); founders are admin-managed (scope update) |
| Brand header + full-bleed hero | **Implemented** (fixed glass capsule overlay; hero photography shows through glass; no white band) |
| Public catalogue search/filter/pagination | **Implemented** (live debounced search; publications also immediate category; both pages Sort by Date on admin dates; Reset/chips/summaries; EN/AR) |

---

## H. Arabic and English localization

### Preference vs implementation

**Preference (updated):** English unmarked; Arabic under `/ar`.  
**Implementation:** **Matches.** `sitePath` / `localizedHref` emit `/ar/...` for Arabic; proxy rewrites to the unprefixed App Router tree.

### Translation sources

| Kind | Location |
| --- | --- |
| UI chrome | `src/messages/ar.json`, `en.json` |
| Publication/event/founder content | DB `*Translation` tables |
| Organization intro/vision/mission | `src/content/about.ts` (localized EN/AR strings) |

### Detection, switching, persistence, fallback

| Concern | Behavior |
| --- | --- |
| Detection | `/ar` prefix (proxy `x-agenda-lang`) → cookie `agenda_locale` (admin) → unmarked default **`en`** (`URL_DEFAULT_LOCALE`). Public unmarked URLs force English via proxy header. Cookie parse helper still falls back to `DEFAULT_LOCALE` (`ar`) when invalid. |
| Switching | `LanguageSwitcher` → cookie + navigate `/` ↔ `/ar/...` → `router.refresh()` |
| Persistence | Cookie max-age 1 year; `httpOnly: false`; `sameSite: lax`; `path: /`; Arabic also encoded in crawlable `/ar` URLs |
| UI dictionary fallback | Missing locale module → English; documented key-level fallback policy in `i18n/config.ts` |
| Content fallback | **No** silent cross-locale DB fallback; missing translation → empty list item filter / 404 detail |

### Server/client sync

Server Components read proxy locale header (and cookie when needed) for first paint (`lang`/`dir` + dictionaries). Client switcher refreshes RSC tree after cookie write + path change. No `localStorage` locale source.

### RTL/LTR and dates

- `localeDirection`: `ar` → `rtl`, `en` → `ltr` on `<html>`.
- Dates: `toLocaleDateString(locale)` in cards/details; hero slider uses `{ day, month: "long", year }` for locale-aware long dates.

### Metadata

Root + page `generateMetadata` emit localized titles/descriptions, absolute canonicals, reciprocal hreflang (`en` / `ar` / `x-default`), OG/Twitter, and robots. Details in `SEO_IMPLEMENTATION.md`.

### Env note

`NEXT_PUBLIC_DEFAULT_LOCALE` appears in `.env.example` / README but is **unused in code**; default is hard-coded `ar`.

---

## I. Configuration and local development

### Prerequisites

- Node.js **20.19+** recommended (Prisma 7; per README)
- npm (lockfile present)
- PostgreSQL required for database-backed features; public shell runs without it

### Scripts (`package.json`)

| Script | Purpose |
| --- | --- |
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint` |
| `typecheck` | `tsc --noEmit` |
| `postinstall` | `prisma generate` |
| `prisma:generate` | Generate client to `src/generated/prisma` |
| `prisma:validate` | `prisma validate` (requires resolvable `DATABASE_URL` via Prisma config) |
| `prisma:migrate` | `prisma migrate dev` |
| `admin:create` | Bootstrap admin from env |
| `media:test-r2` | R2 put/head/delete smoke test |
| `media:migrate-r2` | Local → R2 media migration (dry-run by default) |
| `test` | `vitest run` |
| `test:watch` | `vitest` |

**No** `seed` script. Dev test stack: `vitest` + `@vitest/coverage-v8` (same major; currently `^4.1.12`).

### Local setup

```bash
cp .env.example .env
# edit DATABASE_URL + DIRECT_URL (Supabase) and optional public vars
# (required before npm install — postinstall runs prisma generate)
npm install
npm run prisma:generate
# when DB available:
npx prisma migrate deploy   # apply existing migrations (preferred for remote/Supabase)
# or: npm run prisma:migrate  # prisma migrate dev (local iterative)
npm run dev
```

Open `http://localhost:3000`.

### Environment variables

| Name | Required? | Purpose | Used in code? |
| --- | --- | --- | --- |
| `DATABASE_URL` | For DB features (runtime) | PostgreSQL via transaction pooler (Supabase `:6543?pgbouncer=true`) | Yes — `src/server/db/client.ts` |
| `DIRECT_URL` | For Prisma CLI | PostgreSQL session/direct (Supabase `:5432`) | Yes — `prisma.config.ts` |
| `NEXT_PUBLIC_SITE_URL` | Optional (documented) | Intended site URL | **Not referenced in `src/`** |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Optional (documented) | Documented default locale | **Not referenced in `src/`** (code defaults to `ar`) |
| `AUTH_SECRET` | Future | Auth | Commented example only |
| `ADMIN_SESSION_COOKIE_NAME` | Optional | Session cookie name | Yes — auth |
| `STORAGE_PROVIDER` | Optional | `local` (default), `r2`, or `unimplemented` | Yes — `src/server/storage` |
| `UPLOAD_DIR` | Optional | Local upload root | Yes — local adapter / migration |
| `R2_ACCOUNT_ID` / `R2_BUCKET_NAME` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_ENDPOINT` / `R2_REGION` / `R2_PUBLIC_BASE_URL` | Required when `STORAGE_PROVIDER=r2` | Cloudflare R2 | Yes — server + CLI only (no `NEXT_PUBLIC_`) |

**Never commit real secrets.** Use placeholders like `postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public`.

### Deployment configuration in repo

**None found:** no `vercel.json`, Dockerfile, or `.github` workflows. Hosting target not configured in-repo.

### Next.js config highlights

`cacheComponents: true`, `partialPrefetching: true`, Turbopack CSS rule for Tailwind, `images.remotePatterns` derived from `R2_PUBLIC_BASE_URL` hostname when set.

---

## J. Verification, limitations, and next steps

### Tests

**No** automated tests (`*.test.*` / `*.spec.*` none; no test script). Coverage: **none**.

### Checks performed while preparing this reference (2026-10-18)

| Check | Result |
| --- | --- |
| Full project-owned file inventory (excl. vendors/generated) | Completed |
| Read schema, routes, services, APIs, components, i18n, docs | Completed |
| Confirm no `[locale]` App Router tree | Confirmed absent |
| Confirm no `prisma/migrations` | Confirmed absent |
| Confirm no `.env` present | Confirmed |
| `npm run prisma:validate` | **Failed** — `DATABASE_URL` unresolved (`PrismaConfigEnvError`) |
| `npm run typecheck` | **Passed** (exit 0, no errors) |
| `npm run lint` | **Passed** (exit 0, no errors) |
| `npm run build` | **Not run** |
| Live browser / production DB inspection | **Not performed** |
| Apply migrations / seed / deploy | **Not performed** (out of scope) |

### Known limitations and gaps

1. Migration SQL exists but may not be applied on every developer database yet.
2. No content seed; founders list is empty until admin creates rows.
3. Local filesystem storage is **not** production-ready on ephemeral hosts — use `STORAGE_PROVIDER=r2` and migrate existing files with `npm run media:migrate-r2`.
4. Header uses the vertical English brand lockup; a dedicated horizontal/Arabic header lockup asset is not present.
5. No global public search control in the header (catalogue pages own search/filter).
6. Auth + publications + events + founders + catalogue query unit tests present; DB integration tests skipped without `DATABASE_URL_TEST`.
7. Detail-page gallery uses `<img>` (same as other public media) rather than `next/image` because URLs are dynamic `/api/media/...` paths.
8. Live catalogue filter walkthrough against a running PostgreSQL instance was **not** verified in this change (local `DATABASE_URL` auth failed during probe).

### Date handling (events)

- `eventDate`: visitor-facing occurrence date; stored as UTC calendar date (noon UTC via `src/lib/dates.ts`).
- `createdAt`: record creation; used by admin (and optional public API) **creation-date** filters (`createdFrom`/`createdTo` inclusive UTC day bounds). Not exposed on the public Events page UI/URL.
- Administrators cannot edit `createdAt`.

### Unverified behavior

- Full browser walkthrough of event create → upload → publish → homepage max-3 against a live DB (depends on local credentials/admin user).
- Production/staging environment variables and deployed schema version.

### Suggested next development steps (not done)

1. Configure production host `R2_*` secrets + custom media domain; run local→R2 migration if needed.
2. Optional Arabic logo lockup; browser QA of catalogue filters against a live DB.

---

## K. Change history

### 2026-11-10 — Founder create validation UX + admin session Date prerender

- Confirmed R2 founder portrait upload works; create `400 Validation failed` was Zod rejecting the JSON body (commonly invalid email — client previously only checked non-empty).
- `FounderForm`: client email format check + surface Zod `details` in the Actions error; `errorInvalidEmail` AR/EN strings.
- `getAdminSession`: `await connection()` before expiry `Date` to avoid Next.js blocking-prerender current-time console errors on admin routes.
- Validation: `tsc` after change. No schema/R2 changes.

### 2026-11-10 — Cloudflare R2 storage integration

- Added `CloudflareR2Storage` (`src/server/storage/r2.ts`) selected via `STORAGE_PROVIDER=r2`; AWS SDK v3 S3 client pointed at `R2_ENDPOINT` with `region=auto`.
- New uploads use `agenda/{publications|events|founders}/...` keys; public URLs from `R2_PUBLIC_BASE_URL`; legacy keys keep `/api/media` access-checked delivery with local fallback while unmigrated.
- Media route streams from active provider (R2 or local); orphan cleanup deletes R2 objects when unreferenced.
- CLI: `media:test-r2`, `media:migrate-r2` (dry-run default; never deletes local files). Docs: `CLOUDFLARE_R2_STORAGE.md`. `.env.example` + `next.config.ts` remotePatterns updated.
- No Prisma schema/migration changes. Validation: `tsc` pass; vitest 88 passed / 1 skipped; `next build` pass; `media:test-r2` put/head/delete ok; `media:migrate-r2` dry-run found 9 local assets. ESLint still reports pre-existing unrelated errors. Live admin upload browser QA not claimed here.

### 2026-11-11 — Arabic URLs use `/ar` path prefix

- Replaced crawlable `?lang=ar` with `/ar/...` (English remains unmarked).
- `localizedHref` / `sitePath` emit `/ar` prefixes; proxy rewrites `/ar` to the unprefixed App Router tree and sets `x-agenda-lang`.
- Legacy `?lang=ar` redirects to `/ar/...`; `/en/...` and `?lang=en` redirect to unmarked English.
- Language switcher navigates between unmarked and `/ar` paths. Public unmarked URLs force English via proxy header; admin still uses cookie when header absent.
- Updated SEO docs, tests (`localizedHref`), and this reference.

### 2026-11-11 — Favicon and app icons refresh

- Replaced logo-derived `src/app/icon.png` / oversized apple icon with packaged assets: `favicon.ico`, `icon0.svg`, `icon1.png`, `apple-icon.png`.
- Added PWA maskable icons under `public/web-app-manifest-{192,512}x512.png` and `src/app/manifest.ts` (Agenda name, brand `theme_color` `#05498c`).
- Stopped overriding `metadata.icons` with `ORGANIZATION_LOGO_PATH` in root layout so App Router icon files apply.
- Removed staging folders `favicon-for-app/` and `favicon-for-public/` after install. Updated `SEO_IMPLEMENTATION.md`.

### 2026-11-11 — Connect PostgreSQL to Supabase

- Pointed Prisma CLI at Supabase via `DIRECT_URL` in `prisma.config.ts` (session pooler `:5432`); runtime Client keeps using `DATABASE_URL` (transaction pooler `:6543?pgbouncer=true`) through `@prisma/adapter-pg`.
- Did **not** add `url`/`directUrl` to `schema.prisma` (removed in Prisma 7).
- Documented both URLs in `.env.example` and README.
- Validation: `prisma validate`, `prisma generate`, `prisma migrate deploy` applied all 3 migrations on Supabase; pooled `DATABASE_URL` query listed public tables and 4 seeded `PublicationCategory` rows; `npm run admin:create` created bootstrap admin.

### 2026-11-10 — Public SEO foundation

- Automatic `generateMetadata` for home, publications/events listings + details, and About; descriptions from subtitle/Markdown excerpt; OG/Twitter + branded `/opengraph-image`.
- Crawlable bilingual URLs: English unmarked, Arabic `/ar` (later superseded query `?lang=ar`); proxy syncs header/cookie; hreflang + self-canonicals; catalogue filters `noindex`.
- Dynamic `sitemap.ts` (published content only) and `robots.ts` (blocks admin; noindexes non-prod/localhost/`SEO_NOINDEX`).
- JSON-LD: Organization/WebSite, BreadcrumbList, Article/BlogPosting, conservative Event; logo/icons from official Agenda logo; docs in `SEO_IMPLEMENTATION.md`.
- Validation: SEO unit tests added; full `npm test` / `tsc` as recorded in the implementing session. Live Search Console / Rich Results not run here.

### 2026-11-09 — Remove public side gutters

- Removed `max-w-6xl` from shared public chrome: `Container`, `SiteHeader`, `SiteFooter`, `PageHero`, and home slider copy wrap — content spans the viewport with edge padding only.
- Homepage featured grids no longer use centered narrow max-widths; they use the same full-width 1/2/3-col grid as listing pages.
- Validation: layout class changes only; no schema/API impact. Spot-check home, catalogues, About, and detail pages after refresh.

### 2026-11-09 — Public catalogue Sort by Date

- Added `sort=newest|oldest` (default `newest`, omitted from URLs) to public Publications and Events catalogues via `catalogue-query`, Zod public list schemas, and `listPublishedPublications` / `listPublishedEvents`.
- Publications order by admin `publishedAt` (nulls last) then `id`; Events order by admin `eventDate` then `id` — not `createdAt`/`updatedAt`. Sort applies before pagination and preserves `q`/category.
- UI: Sort by Date dropdown beside existing filters on both pages; EN/AR labels; Reset clears non-default sort with other criteria.
- Validation: catalogue query unit tests updated; `npm test` (77 passed, 1 skipped), `tsc --noEmit` clean.

### 2026-11-07 — YouTube save fix (stale Prisma client)

- Dev `getPrisma()` now recreates the client when `src/generated/prisma/schema.prisma` mtime changes, so fields added by `prisma generate` are not ignored by a long-lived `globalThis` client.
- Admin Publication/Event forms build `youtubeUrl` at submit time (no silent null from memoized payload) and sync the saved URL from the API response.
- Validation: browser save of a publication YouTube URL persisted to Postgres and survived refresh.

### 2026-11-07 — Dynamic publication categories

- Replaced Prisma `PublicationCategory` enum with `PublicationCategory` model (`nameEn`/`nameAr`/`slug`/`requiresAuthor`); publications use `categoryId` FK.
- Migration `20261107180000_publication_categories` seeds Reports/Blogs/Papers/Briefings (slugs `REPORT`/`BLOG`/`PAPER`/`BRIEFING`) and remaps existing rows; Blogs keeps `requiresAuthor`.
- Admin: category dropdown from DB, “+ Add category” modal on create/edit, management page `/admin/publications/categories` (search/edit/delete with in-use guard).
- Public filters/cards/details/homepage use localized `category.name`; filter query still uses slug.
- Validation: Vitest category + publication create schemas; `npm test` / `typecheck` clean after migrate.

### 2026-11-07 — Optional YouTube video (publications & events)

- Added nullable `youtubeUrl` on `Publication` and `Event` (`prisma/migrations/20261107120000_add_youtube_url`); migration applied locally.
- Shared parse/normalize/embed helpers; Zod create/update accept optional URL; services persist/return it on admin + public detail DTOs.
- Admin Media card: YouTube URL field with preview/remove (EN/AR); public detail: `YouTubeEmbed` between gallery and Markdown when set.
- Validation: Vitest coverage for URL formats, rejection, schema normalization. Image gallery/10-image cap unchanged.

### 2026-11-07 — Publication/event image upload cap (10 total)

- Replaced gallery-only max of 20 with shared `MEDIA_LIMITS.maxImagesPerItem` (default 10 = 1 main + up to 9 gallery) for publications and events.
- Backend: `assertContentImageCountAllowed` in publication/event services; create Zod schemas capped at `maxImagesPerItem`; update schemas allow grandfathered over-limit arrays (service blocks increases only).
- Admin New/Edit forms: live `{current} / {max}` counter, updated EN/AR helper copy, disable gallery/main add at limit, multi-file gallery selection rejects when exceeding remaining slots; replace/reorder/remove unchanged.
- Env: `UPLOAD_MAX_IMAGES_PER_ITEM` (`.env.example`); removed `UPLOAD_MAX_GALLERY_IMAGES`.
- Validation: Vitest media-limits + schema coverage for cap, remaining slots, and grandfathering.

### 2026-11-07 — Vitest peer dependency align

- `npm install` failed with `ERESOLVE`: `@vitest/coverage-v8@^5.0.5` required peer `vitest@5.0.5` while the project had `vitest@^4.1.12`.
- Aligned `@vitest/coverage-v8` to `^4.1.12` (same major as `vitest`). Attempt to bump both to Vitest 5 pulled `5.1.x`, which conflicted with `@types/node@^20`.
- Reference: documented `test` / `test:watch` scripts; local setup copies `.env` before `npm install` so `postinstall` → `prisma generate` can resolve `DATABASE_URL`.
- Validation: `npm i` succeeded with `DATABASE_URL` set; `npm test` — 20 files / 59 tests passed (1 skipped).

### 2026-10-21 — Homepage About teaser logo

- Replaced the inclusion line illustration in `HomeAboutSection` with the official logo (`public/images/agenda-logo.png`, transparent crop of `Agenda-logo.png`). About page vision/mission illustrations unchanged.
- Validation: homepage HTML from the running dev server includes `/images/agenda-logo.png` inside the About teaser. Browser screenshot not taken.

### 2026-10-20 — Admin Founders redesign

- List: subtitle + blue “New founder”, `admin-panel` search (debounced AR/EN names, clear, results count), desktop table (circular portrait + name/area, email, publication count, 1-based position, Edit + overflow View public / Delete), mobile cards; Retry only on failures.
- Reorder: secondary **Reorder founders** dialog (full-screen on small viewports) loads complete unfiltered list via `GET ?forOrder=1` / `listAllAdminFoundersOrdered`; DnD + move up/down; Save disabled until dirty; conflict if founders added/removed mid-edit (409); disabled when fewer than two founders. Removed permanent duplicate order section.
- New/Edit: breadcrumbs, two-column layout, AR/EN tabs (plain-text biography, paragraph breaks preserved — not Markdown), circular portrait MediaDropzone + Replace (no Remove — image required server-side), contact email (LTR), profile details with immutable bioKey + public link copy/view + timestamps; sticky Cancel / Create or Save changes; unsaved warning.
- Delete: `AdminConfirmDialog` with linked publication count; 409 blocked messaging unchanged (no cascade).
- Dictionaries: expanded `admin.founder` EN/AR. Reference routes/components/services updated.
- Validation: `typecheck`, `lint`, and `tests/founders` (8 passed) succeeded.

### 2026-10-20 — Admin Homepage selection redesign

- Redesigned `/admin/homepage` into two `admin-panel` sections (Featured publications / Featured events) aligned with Publications/Events admin chrome: ~60/40 selected vs available on wide screens, stacked on mobile.
- Selected items are cards (order badge, thumbnail + fallback, title, category/date or event date, “First slide” on first publication, drag-and-drop + keyboard move, Remove from homepage). Available lists: bilingual title search (debounced), load-more, Add; events enforce max 3 with clear messaging.
- Independent dirty / Saved / Saving / Reset / brand-blue Save per section; beforeunload when either is dirty; empty-save explains homepage empty states; conflict messages when items deleted/unpublished since load; initial-load failure + Retry via `GET /api/admin/homepage`.
- Service admin state now includes `titleAr`/`titleEn`, publication category + `publishedAt`; actionable 409 copy on save. Business rules unchanged (published-only; unlimited pubs; max 3 events; sectioned PUT).
- Dictionaries: expanded `admin.homepageAdmin` EN/AR. Reference sections for HomepageSelection / homepage service updated.
- Validation: `typecheck`, `lint`, homepage selection/validation tests (9 passed) succeeded.

### 2026-10-19 — Catalogue / About page heroes

- Added reusable `PageHero` (gradient, breadcrumbs, accent line, glass-framed 4:3 image, curved handoff) on `/publications`, `/events`, `/about`; full-bleed under fixed glass header like the home slider.
- Temporary SVG placeholders in `public/images/heroes/` configured via `src/content/page-heroes.ts` (`src`, `alt`, `objectPosition`) — replace files + config when final photos arrive.
- Removed duplicate `PageHeading` intros; filters/search and About vision/mission/founders anchors unchanged. Hero descriptions localized EN/AR.
- Validation: `lint`, `typecheck`, `build` passed.

**Replace temporary hero images**

| Page | Asset path | Config key in `src/content/page-heroes.ts` |
| --- | --- | --- |
| Publications | `public/images/heroes/publications-hero.svg` | `PAGE_HEROES.publications` |
| Events | `public/images/heroes/events-hero.svg` | `PAGE_HEROES.events` |
| About | `public/images/heroes/about-hero.svg` | `PAGE_HEROES.about` |

Swap in PNG/JPEG/WebP at the same path (or update `src`), set non-empty `alt` when the image is meaningful, and tune `objectPosition` (e.g. `center top`).

### 2026-10-19 — Homepage section hierarchy polish

- Added shared `SectionHeader` (pill label, fluid editorial title, description, outlined action) for Publications and Events; About teaser reuses the same label/title/action styling.
- Localized section intros (Research & Perspectives / Dialogue & Participation / About Us) in EN/AR dictionaries; no “latest/upcoming” claims.
- Clearer rhythm: ~40–72px section padding, Events on subtle neutral wash, shared `Container` width; hero text aligned to `max-w-6xl` while arrows stay at edges.
- Homepage grids center 1–2 featured cards without stretching; listing pages keep full 3-col grids. Tightened card blue-panel padding and excerpt reserve (2 lines).
- About illustration enlarged within its panel; solid CTA replaced with outlined section action.
- Validation: `lint`, `typecheck`, `build` passed.

### 2026-10-20 — Admin Events redesign + shell gap / nav fixes

- Fixed admin layout gap: removed centered `max-w-[1440px]` wrapper around sidebar+main; sidebar is flush to the viewport start edge (LTR left / RTL right); content max-width applies only inside `<main>`; header is full-bleed.
- Fixed active nav: `AdminSidebar` uses client `usePathname()` with prefix matching (`/admin/events` stays active on list/new/edit; Homepage no longer falsely active).
- Events list matches Publications: header + blue New event, debounced search, Status + Created from/to filters (labeled; range validation), result count, desktop table + mobile cards, Edit + overflow View/Delete, pagination.
- Event New/Edit: two-column layout, AR/EN tabs, MediaDropzone, sticky/state-aware publish actions, unpublish confirm; no PDF/category/author fields. Public Events catalogue remains search-only.
- Validation: `lint`, `typecheck`, `test` (59 passed + 1 skipped), `build` passed.

### 2026-10-20 — Admin Publications redesign + shared shell

- Shared admin shell (`.admin-shell`): sticky header with logo/account/language/sign-out, full-height sidebar with icons + blue active state, mobile nav drawer; sidebar flush to edge, content max-width ~1440px inside main only. Public pages unaffected.
- Publications list: page header + blue “New publication”, cohesive filter panel (debounced search, immediate category/status, clear filters, result count), desktop table (thumbnail+title, badges, homepage, Edit + overflow View/Delete), mobile cards, confirm delete, pagination preserved.
- Publication New/Edit: breadcrumbs, status badge, unsaved indicator; desktop two-column layout (content+media | settings+sticky publish); AR/EN content tabs with error indicators; MediaDropzone for main/gallery/PDF with replace-safe uploads; state-aware Save draft / Publish / Save changes / Unpublish (confirmed); author selection retained across category changes; media limits from `MEDIA_LIMITS`.
- Shared helpers: `AdminConfirmDialog`, `AdminOverflowMenu`, `MediaDropzone`; Button `brand`/`danger` variants. EN/AR `admin.pub` labels expanded.
- Validation: `lint`, `typecheck`, `test` (59 passed + 1 skipped), `build` passed.

### 2026-10-19 — Admin Markdown editor + shared public rendering

- Replaced basic Write/Preview textarea with shared `MarkdownEditor`: formatting toolbar (H1–H6, bold/italic/strike, lists, tasks, quotes, links, images, inline/fenced code, tables, HR, undo/redo), Write / Preview / Split (Split desktop-only), expand mode, and Markdown help.
- Toolbar inserts/wraps Markdown at the cursor with placeholders; link/image/code dialogs; Ctrl/Cmd+B/I and undo shortcuts; buttons are `type="button"` (no form submit). Content remains Markdown strings (no HTML storage).
- Wired into Publication and Event create/edit for Arabic and English descriptions via shared `admin.markdown` labels.
- Unified `MarkdownContent` / `ArticleMarkdown` + `.article-prose` for admin preview and public publication/event details (GFM, sanitized, safe http(s)/mailto, images, task lists, heading levels shifted under page H1, LTR code/URLs in RTL).
- Dependencies unchanged (`react-markdown`, `remark-gfm`, `rehype-sanitize`, `rehype-external-links`). Tests: `tests/publications/markdown.test.tsx`, `markdown-editor.test.ts`.
- Validation: `lint`, `typecheck`, `test` (59 passed + 1 skipped), `build` passed.

### 2026-10-19 — About Us founders section redesign

- Replaced compact horizontal founder cards with spacious profile rows: circular portraits (~144–192px) with soft blue ring beside softly rounded pale panels (~24px radius).
- Desktop alternates portrait/panel sides for successive founders; a single founder is centered as one group; mobile stacks portrait above panel (text stays language-aligned).
- Hierarchy: editorial name → brand-blue role → unclipped biography (~16px / 1.7 leading, ~prose width) → labeled mailto with envelope icon; empty optional fields hidden.
- Preserved `founder-{bioKey}` anchors, `.anchor-offset`, admin ordering, and localization (`about.founderEmail` EN/AR). No decorative “Read more”.
- Validation: `lint`, `typecheck`, `tests/founders` (8 passed), `build` passed.

### 2026-10-19 — Fixed glass header overlay (no white band)

- Converted public `SiteHeader` from sticky in-flow to **fixed** transparent overlay so heroes start at the viewport top with no separate white header band.
- Shared CSS vars: `--site-header-top-gap` (~16px), `--site-header-height`, `--site-header-offset`; clearance lives in hero padding / `.public-main-offset` (detail pages, Suspense fallback) — not negative margins.
- Home slider + `PageHero` (publications/events/about) pad content under the capsule; publication/event detail pages use white `.public-main-offset` wrappers.
- Glass styling, always-visible scrolling, mobile menu `z-[55]` under header `z-50` overlay, gallery lightbox `z-[100]`, and `anchor-offset` preserved. Admin layouts unchanged.
- Validation: `lint`, `typecheck`, `test` (52 passed + 1 skipped), `build` passed.

### 2026-10-19 — Sticky glass header + footer chrome

- Shared `.glass-panel` material (Agenda blue tint, ~20px blur, translucent white border, inner highlight, opaque fallback) on public header and footer.
- Originally sticky floating capsule (later converted to fixed overlay — see entry above); pill nav + glass language switcher; logo on light backing; mobile glass menu.
- Homepage hero full-viewport under header so photography shows through glass; `anchor-offset` / About anchors + founder bio anchors; gallery lightbox remains `z-[100]`.
- Footer: brand + mission summary, two nav columns, Facebook/LinkedIn/YouTube circular links, copyright + domain; no newsletter.
- Validation: `lint`, `typecheck`, `build` passed.

### 2026-10-19 — Live catalogue search (no Apply button)

- Publications and Events toolbars update results while typing (300ms debounce; clearing search applies immediately; Enter flushes debounce).
- Removed Apply buttons; category changes apply immediately and keep the current draft search text; Events remain title-search only.
- Filter updates use `router.replace` (no history entry per keystroke); generation tokens cancel stale debounces on reset/category/clear/unmount; IME composition ignored until complete.
- Soft navigation keeps prior cards visible with a localized “Updating results…” indicator; URL still drives server-side list queries before pagination.
- Validation: `tests/catalogue/query.test.ts` (9 passed), `typecheck`, `lint` passed.

### 2026-10-19 — Events page: remove public creation-date filters

- Public Events toolbar is title search only (Apply/Reset); removed Created from/to, helper text, date chips, and range validation.
- Events URL handling applies only `q` and `page`; legacy `createdFrom`/`createdTo` query params are ignored and no longer filter results. Search still resets to page 1.
- Backend/API/admin creation-date filters unchanged. Publications catalogue unchanged.
- Validation: `tests/catalogue/query.test.ts` (8 passed), `typecheck`, `lint` passed.

### 2026-10-19 — Public catalogue search, filters, and pagination

- Replaced placeholder publications/events filter UIs with working toolbars (neutral panel, ~44px controls, brand-blue Apply, Reset when active, search icon, visible labels).
- Publications: `q` (locale title, case-insensitive partial) **AND** `category`; Events initially also had creation-date URL filters (later removed from the public page — see entry above).
- URL is applied-state truth (`page` resets on criteria change); pending form edits until Apply/Enter; chips remove immediately; language switch preserves query string.
- Server list services filter before pagination (same `where` for count + items); `id` order tie-breaker; invalid category/page handled without crash; DB unavailable/error distinct from empty/no-match.
- Dictionaries: catalogue + publications/events filter/results/empty strings (EN/AR). Tests: `tests/catalogue/query.test.ts`.
- Validation: `lint`, `typecheck`, `test` (53 passed + 1 skipped), `build` passed. Live DB filter probe not verified (auth failure against local Postgres).

### 2026-10-19 — Content card hierarchy polish

- Tightened publication/event `ContentCard`: ~12px radius, 4:3 image, smaller badge, blue panel hierarchy title → excerpt → author → date/Read more bottom row with arrow icon.
- Desktop/tablet reserved title/excerpt line boxes for row alignment; mobile drops reserved blank space. Blog “By / بقلم” quieter author link; hover lift with reduced-motion respect.
- Applied via shared card on home, publications, and events grids.

### 2026-10-19 — Expandable share menu

- Replaced always-visible share icon row with a circular Share trigger that expands a white pill menu (pointer, thin separators, brand-styled social icons).
- Actions: X, Facebook, LinkedIn, Email, Copy link (no Google+). Toggle / outside click / Escape close; focus returns to trigger on Escape; reduced-motion respected.
- Desktop opens beside the trigger (logical inline-end); mobile opens below to avoid overflow. Shared by publication and event details; PDF actions remain below with extra spacing.

### 2026-10-18 — Publication PDF actions (no iframe)

- Removed embedded PDF preview from publication details.
- `PublicationPdfActions` under share controls: primary **View PDF / عرض الملف** (new tab) and outlined **Download PDF / تحميل الملف** (fetch blob via `/api/media/...?download=1`).
- Media route sets `Content-Disposition: attachment` when `download=1`. Events unchanged. Gallery → Markdown order preserved.

### 2026-10-18 — Detail gallery layout polish

- `MediaGallery` main viewer: full-bleed `object-cover` / `object-center` inside the rounded frame (no gray letterboxing); fullscreen lightbox still uses `object-contain`.
- Thumbnail row centered when it fits (`w-max min-w-full justify-center`); horizontal scroll when wider than the gallery; selected thumb still scrolled into view. Applies to publication and event details.

### 2026-10-18 — Publication and event detail pages

- Editorial detail layout for `/publications/[slug]` and `/events/[slug]`: breadcrumbs, category/date, title/subtitle, share controls, reusable `MediaGallery`, Markdown **below** gallery, publication PDF section (open/download/preview).
- Blog author block: circular portrait, professional area, bio link; DTO/service mapping extended with `authorImageUrl`, `authorProfessionalArea`, structured `images` (main first, gallery deduped by media id, localized alt).
- `ShareControls` (X/Facebook/LinkedIn/email/copy) and gallery lightbox with Escape, focus restore, keyboard/swipe, RTL-aware navigation; no autoplay.
- `.article-prose` typography for headings, lists, quotes, tables, code. Dictionary keys for share/gallery/PDF/breadcrumbs (EN/AR).
- Validation: `typecheck`, `lint`, `build` passed.

### 2026-10-18 — About Us page + homepage organization section

- Filled `src/content/about.ts` with localized vision, mission, page intro, and homepage mission summary (exact supplied EN/AR copy; summaries derived faithfully).
- Homepage `HomeAboutSection`: About label, site name heading, vision, mission summary, “More about us / المزيد عنا” CTA, inclusion illustration panel.
- About page: intro, alternating vision/mission illustration blocks (blue accents, white panels, decorative circles), founders section with full biographies and `#founder-{bioKey}` anchors + `scroll-mt`.
- Lightweight SVG illustrations (no new icon dependency). Dictionaries: Our Vision/Our Mission (رؤيتنا/رسالتنا); updated CTAs and empty-founders copy.
- Validation: `typecheck`, `lint`, `test` (founder biography), `build` passed.

### 2026-10-18 — Publication and event content cards

- Shared `ContentCard` + `CardMedia`: 4:3 cover image, white/blue category badge, primary-blue panel (`#05498C`), line-clamped title/subtitle, localized Read more, bottom date; restrained hover zoom; missing/failed image fallback.
- Applied on home publications grid, featured events (max 3), `/publications`, and `/events` via updated `PublicationCard` / `EventCard` / grids.
- Events badge uses dictionary `events.categoryEvent` (Event / فعالية) — no new DB category field. Blog author bio links preserved as independent links.
- Section headings/spacing tightened on home; page titles use editorial font. Dictionaries gained `publications.readMore`, `events.readMore`, `events.categoryEvent`.
- Validation: `typecheck`, `lint`, `build` passed. Live card imagery depends on DB media.

### 2026-10-18 — Homepage header + full-bleed publications slider

- Branded public header: official logo (`public/images/agenda-logo.png`, transparent crop from `Agenda-logo.png`), centered nav with primary-blue active state, EN|AR switcher, accessible mobile menu (Escape, focus return, overlay).
- Full-bleed featured publications hero fills ~first viewport below header (`svh`/`dvh`/`vh` − `--site-header-height`); removed temporary Home heading/placeholder copy and container constraint around the slider.
- Slider: category/title/subtitle/date/author/CTA from admin-featured publications; manual arrows/dots/keyboard/swipe only; empty + missing-image fallbacks; RTL/LTR alignment; Source Serif 4 + Noto Sans Arabic added.
- Brand CSS vars `#05498C` / `#878787`. No decorative search icon (public search not implemented).
- Validation: `typecheck`, `lint`, `build` passed. Visual QA of live featured content depends on local DB rows.

### 2026-10-18 — Founders module (admin + About Us)

- Scope update: founders manageable in admin (documented in `docs/WEBSITE_REQUIREMENTS.md` §2.5; PDF left as original source).
- Admin list/create/edit/delete + `PUT /api/admin/founders/reorder` (complete ID list).
- Required ar+en name/area/biography, email, profile image; immutable `bioKey`; delete blocked (409) while publications reference the founder.
- Media purpose `founder-profile`; About Us uses `FounderBiography` with `#founder-{bioKey}` anchors.
- Validation: `typecheck`, `lint`, `test` (43 passed), `build`, `prisma:validate` passed. No schema migration (service-enforced required fields on optional DB columns).
- Updated README, IMPLEMENTATION_PLAN, PROJECT_FOUNDATION, WEBSITE_REQUIREMENTS, and this reference.

### 2026-10-18 — Events module (admin + homepage events)

- Implemented event admin list/create/edit/delete, draft/publish/unpublish, bilingual Markdown, main image + gallery (no PDF).
- Shared media upload purposes `event-main` / `event-gallery`; orphan cleanup still respects cross-entity references.
- Homepage featured events (max 3) via sectioned `PUT /api/admin/homepage` (omitted sections preserved).
- Public event detail uses safe Markdown + gallery; creation-date filter bounds documented.
- Validation: `typecheck`, `lint`, `test` (36 passed), `build` passed. No new Prisma migration.
- Updated README, IMPLEMENTATION_PLAN, PROJECT_FOUNDATION, and this reference.

### 2026-10-18 — Publications module (admin + storage)

- Implemented publication admin list/create/edit/delete, draft/publish/unpublish rules, bilingual translations, founder author for blogs, gallery/PDF/main image uploads.
- Local `StorageProvider` + access-checked `GET /api/media/[...key]`; abandoned-upload cleanup best-effort; draft assets not anonymously readable.
- Homepage publication selection API/UI (`PUT /api/admin/homepage`) preserves `FeaturedEvent` rows.
- Safe Markdown (`react-markdown` + sanitize) for admin preview and public detail; gallery images shown on public detail.
- Added Vitest coverage for auth gates, validations, slugify, markdown safety, media limits, homepage contract.
- Validation: `typecheck`, `lint`, `test` (26 passed), `build` passed. No new Prisma migration (existing schema sufficient). Live upload/publish browser QA not claimed here.
- Updated README, `.env.example`, `docs/IMPLEMENTATION_PLAN.md`, and this reference.

### 2026-10-18 — Phase 2 admin authentication

- Implemented Argon2id passwords, opaque `AdminSession` cookies, `LoginThrottle`, CSRF Origin checks, login/logout APIs, bilingual login UI, authenticated admin shell, `npm run admin:create`.
- Added `prisma/migrations/20251018100000_init` (full schema including auth tables).
- Added Vitest unit tests for redirects, CSRF helper, password/tokens, throttle window.
- Updated README, PROJECT_FOUNDATION, IMPLEMENTATION_PLAN, and this reference.

### 2026-10-18 — Initial reference

- Created `agenda_website_reference.MD` from a full source inspection of the Phase 1 foundation.
- Documented stack versions from lockfile; routes; components; Prisma schema; APIs/services; i18n (unprefixed URLs + cookie); env/scripts; gaps vs `docs/WEBSITE_REQUIREMENTS.md`.
- Added Cursor rule `.cursor/rules/maintain-agenda-reference.mdc` (`alwaysApply: true`) to keep this file current with code changes.

---

*End of reference. When updating this document after code changes, revise the relevant sections in place and add a dated history entry summarizing meaningful changes and validation performed.*
