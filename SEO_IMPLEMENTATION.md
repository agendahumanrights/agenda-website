# SEO Implementation — Human Rights Agenda

Technical SEO foundation for [https://humanrightsagenda.org](https://humanrightsagenda.org).  
SEO is generated automatically from existing publication/event fields. **No admin SEO fields and no new Prisma SEO columns.**

---

## 1. Architecture

| Layer | Role |
| --- | --- |
| `src/lib/seo/*` | Site URL, locale URLs, excerpts, metadata builders, JSON-LD helpers |
| `src/app/sitemap.ts` | Dynamic XML sitemap from published DB content |
| `src/app/robots.ts` | Crawl rules + sitemap pointer; blocks indexing on non-prod |
| `src/app/opengraph-image.tsx` | Branded 1200×630 fallback social image |
| `src/proxy.ts` | `?lang=` → request header + cookie; legacy `/ar`/`/en` redirects |
| Public `generateMetadata()` | Per-route titles, descriptions, canonical, hreflang, OG/Twitter |
| `JsonLd` component | Safe JSON-LD in server-rendered HTML |

---

## 2. Files added / modified (summary)

**Added**

- `src/lib/seo/site-url.ts`, `locale-url.ts`, `excerpt.ts`, `metadata.ts`, `json-ld.ts`, `page-metadata.ts`
- `src/components/seo/JsonLd.tsx`
- `src/server/services/seo-sitemap.ts`
- `src/app/sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, `twitter-image.tsx`
- `src/app/icon.png`, `src/app/apple-icon.png` (from official logo)
- `public/images/brand/agenda-logo.png`
- `tests/seo/excerpt.test.ts`
- `SEO_IMPLEMENTATION.md` (this file)

**Modified (high level)**

- Root layout metadata, proxy, locale resolution, language switcher, nav/footer/cards links
- Home, Publications, Events, About, publication/event detail pages (`generateMetadata` + JSON-LD)
- Catalogue href builders preserve `lang`
- `.env.example`, `agenda_website_reference.MD`, EN/AR `meta` copy

---

## 3. Automatic metadata rules

| Field | Source |
| --- | --- |
| Title | Localized content title + `\| {siteName}` (avoids double site name) |
| Description | Subtitle → Markdown plain-text excerpt → localized fallback |
| OG/Twitter image | Main image URL if present, else `/opengraph-image` |
| Article dates | Publication: admin `publishedAt`; Event: admin `eventDate` |
| Author | Founder name when category requires author |
| Canonical | Absolute localized URL for the active language |
| hreflang | Only locales with a real non-empty translation title |

Markdown is stripped (headings, links, code, HTML) before descriptions. Copy is never invented.

---

## 4. Arabic / English URL strategy

Paths stay **unprefixed** (no `/ar` or `/en`).

| Language | URL shape |
| --- | --- |
| English | `https://humanrightsagenda.org/publications/example` |
| Arabic | `https://humanrightsagenda.org/publications/example?lang=ar` |

Resolution order:

1. `lang` query (via `x-agenda-lang` from proxy)
2. `agenda_locale` cookie
3. English unmarked default (`URL_DEFAULT_LOCALE`)

Behavior:

- `?lang=en` redirects to the unmarked URL
- Legacy `/ar/...` → unprefixed + `?lang=ar`; `/en/...` → unmarked
- Language switcher updates the query + cookie and navigates
- Internal public links pass locale so Arabic keeps `lang=ar`
- HTML `lang` / `dir` match the resolved locale
- Reciprocal `hreflang` includes `en`, `ar` (when translated), and `x-default` (English)

---

## 5. Canonical rules

- Origin from `NEXT_PUBLIC_SITE_URL` (production should be `https://humanrightsagenda.org`)
- Absolute canonicals; self-referencing per language
- Catalogue filter/search/non-default sort URLs: **noindex,follow** with canonical still pointing at the clean listing for that language
- Pagination keeps functional links; filtered views are not index targets
- Tracking/sort params are not part of the preferred indexable URL

---

## 6. Sitemap

- Route: `/sitemap.xml` (`src/app/sitemap.ts`; dynamic via DB reads — no `revalidate` export because `cacheComponents` is enabled)
- Includes: home, publications, events, about (both languages) + published publication/event detail URLs for locales that have titles
- Excludes: drafts, admin, API, auth
- Each entry includes `alternates.languages` when applicable
- `lastModified` uses record `updatedAt` for content rows

---

## 7. robots.txt

- Production: allow `/`; disallow `/admin` and `/api/admin`; sitemap + host set
- Non-production (localhost, `VERCEL_ENV !== production`, or `SEO_NOINDEX=true`): `Disallow: /`
- robots.txt is not a security boundary — admin remains auth-protected

---

## 8. Structured data (JSON-LD)

| Page | Types |
| --- | --- |
| Home | `Organization`, `WebSite` |
| About | `Organization`, `BreadcrumbList` |
| Listings | `BreadcrumbList` |
| Publication detail | `BreadcrumbList` + `Article` or `BlogPosting` |
| Event detail | `BreadcrumbList` + `Event` (name, description, url, startDate, image, organizer only) |

Social profiles in Organization `sameAs` match the public footer links.  
JSON is escaped (`<` → `\u003c`) before embedding.

Event rich-result eligibility is **not** claimed: location/offers/precise times are not in the data model.

---

## 9. Logo / favicon / social assets

| Asset | Location |
| --- | --- |
| Brand logo | `public/images/brand/agenda-logo.png` (from `Agenda-logo.png`) |
| App icon / Apple touch | `src/app/icon.png`, `src/app/apple-icon.png` |
| Default OG/Twitter | `src/app/opengraph-image.tsx` / `twitter-image.tsx` (1200×630) |

Organization schema logo uses the brand PNG.

---

## 10. Social sharing

Every public page metadata includes Open Graph + Twitter `summary_large_image` with localized title/description and absolute image URLs. Detail pages prefer the content main image.

---

## 11. Indexing / noindex

| Case | Behavior |
| --- | --- |
| Production public pages | index, follow |
| Catalogue with q/category/non-default sort | noindex, follow |
| Staging / localhost / `SEO_NOINDEX` | noindex site-wide via robots + root metadata |
| Missing/unpublished detail | real `404` via `notFound()` |

---

## 12. Performance notes

- Metadata and JSON-LD are server-rendered (no client JS required for crawlers)
- Sitemap revalidates hourly
- Media delivery already uses cache headers for published assets
- Article Markdown already shifts headings (`shiftHeadings`) to avoid duplicate H1s
- No new third-party SEO libraries added

Unverified: live Lighthouse/CWV numbers were not measured in this change.

---

## 13. How new content gets SEO

1. Admin publishes a publication/event with localized title (and optional subtitle/body/main image/dates).
2. Public detail `generateMetadata` reads those fields.
3. Sitemap picks up published slugs on the next regeneration window (≤ 1 hour, or sooner on redeploy).
4. No extra SEO form fields are required.

---

## 14. Testing results (this session)

| Check | Result |
| --- | --- |
| Unit tests | **82 passed**, 1 skipped (includes `tests/seo/excerpt.test.ts`) |
| `tsc --noEmit` | **Clean** |
| `next build` | **Passed** (`/sitemap.xml`, `/robots.txt`, `/opengraph-image`, icons present) |
| Google Rich Results / Search Console live validation | **Not run** (manual — see §17) |
| Production crawl of humanrightsagenda.org | **Not run** until deploy |

---

## 15. Remaining limitations

- First visit without cookie/lang defaults to **English** for unmarked URLs (SEO URL contract). Arabic remains via `?lang=ar` or the switcher.
- Event schema omits location/attendance — insufficient for full Event rich results.
- `dateModified` is not emitted on article cards unless a reliable public `updatedAt` is added to detail DTOs later.
- Founder bios are About page anchors, not separate indexable profile URLs.
- OG fallback image is generated at request/build time via `next/og` (requires Node runtime).

---

## 16. Production deployment checklist

1. Set `NEXT_PUBLIC_SITE_URL=https://humanrightsagenda.org` (no trailing slash).
2. Ensure `SEO_NOINDEX` is unset/false in production.
3. Confirm HTTPS and preferred host (www vs apex) redirect at the host/CDN.
4. Deploy and open `/robots.txt` and `/sitemap.xml`.
5. Spot-check view-source on `/`, `/?lang=ar`, a publication EN/AR URL for title, canonical, hreflang, OG, JSON-LD.
6. Verify `lang`/`dir` on `<html>` for both languages.
7. Confirm drafts return 404 publicly and do not appear in the sitemap.

---

## 17. Manual Google Search Console setup

1. Add/verify `https://humanrightsagenda.org` (and www if used) as a property.
2. Submit `https://humanrightsagenda.org/sitemap.xml`.
3. Use URL Inspection on home, one publication, one event (EN + AR).
4. Optional: Rich Results Test on a publication and event URL.
5. Monitor Coverage / Experience reports after indexing begins.

Indexing and ranking are **not guaranteed** by this implementation.
