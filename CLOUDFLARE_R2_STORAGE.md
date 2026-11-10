# Cloudflare R2 Storage — Agenda Website

Server-side media storage for publications, events, and founders via Cloudflare R2’s S3-compatible API.

## Architecture

```text
Admin upload (authenticated)
  → POST /api/admin/media/upload
  → uploadMediaAsset (MIME sniff + size limits)
  → StorageProvider.upload()
       ├─ STORAGE_PROVIDER=local → LocalFilesystemStorage
       └─ STORAGE_PROVIDER=r2    → CloudflareR2Storage (@aws-sdk/client-s3)
  → MediaAsset.storageKey persisted in PostgreSQL

Public pages
  → services call getStorage().getPublicUrl(storageKey)
       ├─ keys under agenda/     → {R2_PUBLIC_BASE_URL}/{key}
       └─ legacy local keys      → /api/media/{key} (access-checked; local and/or R2)
```

- Credentials stay server-side only (never `NEXT_PUBLIC_*`).
- Uploads go through authenticated Next.js route handlers (no browser R2 credentials).
- YouTube URLs are unchanged and are never uploaded to R2.
- No Prisma schema migration is required: the DB already stores `MediaAsset.storageKey`.

## Environment variables

| Name | Purpose |
| --- | --- |
| `STORAGE_PROVIDER` | Set to `r2` to enable Cloudflare R2 |
| `R2_ACCOUNT_ID` | Cloudflare account id |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_ACCESS_KEY_ID` | R2 S3 API access key id |
| `R2_SECRET_ACCESS_KEY` | R2 S3 API secret access key |
| `R2_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_REGION` | Use `auto` |
| `R2_PUBLIC_BASE_URL` | Public HTTPS base for objects (r2.dev or custom domain). **Not** the S3 API endpoint |

Placeholders only — configure real values in `.env` / hosting secrets. Never commit secrets.

Optional (unchanged):

- `UPLOAD_DIR` — local root when `STORAGE_PROVIDER=local` or for migration source files
- `UPLOAD_MAX_IMAGE_BYTES`, `UPLOAD_MAX_PDF_BYTES`, `UPLOAD_MAX_IMAGES_PER_ITEM`

## Bucket configuration

1. Create an R2 bucket (e.g. `agenda-media`).
2. Create an **R2 API token** with **Object Read & Write** on that bucket.
3. Enable a **public development URL** (`*.r2.dev`) or attach a **custom domain** for production.
4. Set `R2_PUBLIC_BASE_URL` to that public origin (no trailing slash).

### Required permissions

Minimum: Object Read + Object Write on the target bucket (PutObject, GetObject, HeadObject, DeleteObject).

Do not grant account-wide delete permissions beyond what the app needs.

## Object key structure

New uploads:

```text
agenda/
├── publications/
│   ├── main/{uuid}-{safeName}.ext
│   ├── gallery/{uuid}-{safeName}.ext
│   └── documents/{uuid}-{safeName}.pdf
├── events/
│   ├── main/{uuid}-{safeName}.ext
│   └── gallery/{uuid}-{safeName}.ext
├── founders/
│   └── profile/{uuid}-{safeName}.ext
└── other/
```

- Filenames are sanitized; object keys always include a UUID (no trusted user paths).
- MIME type is detected from file bytes (`file-type`), not the browser-reported type.
- Objects are stored with `Cache-Control: public, max-age=31536000, immutable`.
- Entity IDs are not in the path because uploads occur before content is saved (orphan-then-attach).

Legacy local keys (e.g. `publications/publication-main/2025/...`) remain valid. With `STORAGE_PROVIDER=r2` they continue to resolve through `/api/media/...` until rewritten by the migration script.

## Upload process

1. Admin session required (`requireAdminSession` + same-origin CSRF).
2. Validate purpose (`publication-main`, `publication-gallery`, `publication-pdf`, `event-main`, `event-gallery`, `founder-profile`).
3. Sniff MIME; enforce allow-lists and size limits.
4. Upload to R2; on DB insert failure, delete the orphaned object.
5. Attach media ids on publication/event/founder save; image cap remains **10** total (main + gallery).

## Replacement and deletion

- **Replace:** upload new asset → update FK → `deleteMediaAssetIfOrphaned` on the previous id (deletes R2 object only when unreferenced).
- **Delete / remove:** clear FK or gallery row → orphan cleanup deletes the R2 object when safe.
- **Reorder gallery:** updates `sortOrder` only; no re-upload.
- Partial failures leave DB as source of truth; storage cleanup is best-effort and logged without secrets.

## Database integration

| Model field | Role |
| --- | --- |
| `MediaAsset.storageKey` | Stable object key (unique) |
| `MediaAsset.filename` / `mimeType` / `sizeBytes` | Display + validation metadata |
| Publication / Event / Founder FKs | Reference `MediaAsset.id` |

No new columns. Public URLs are computed at read time via `getPublicUrl`.

## Local media migration

```bash
# Dry-run (default): report only
npm run media:migrate-r2

# Upload to R2 under the same storageKey (idempotent; never deletes local files)
npm run media:migrate-r2 -- --execute

# After verified upload, rewrite keys to agenda/... so CDN public URLs are used
npm run media:migrate-r2 -- --execute --rewrite-keys

# Limit for smoke tests
npm run media:migrate-r2 -- --execute --limit=5
```

Behavior:

1. Reads all `MediaAsset` rows.
2. Locates files under `UPLOAD_DIR`.
3. Skips when R2 already has the object at the expected size.
4. Uploads, HEADs to verify, then optionally updates `storageKey`.
5. Prints a per-asset report. Does **not** delete local files.

Recommended order: dry-run → `--execute` → verify public pages → optional `--rewrite-keys` → set `STORAGE_PROVIDER=r2` if not already.

## Public URL configuration

Example:

`{R2_PUBLIC_BASE_URL}/agenda/publications/main/{filename}`

- Use HTTPS in production.
- Open Graph / JSON-LD use `absoluteUrl()`, which passes through already-absolute R2 URLs.
- Draft/unpublished assets on the public bucket are obscure (UUID keys) but reachable if the URL leaks. Prefer keeping sensitive drafts off shared channels; legacy `/api/media` keys remain access-checked.

## Production custom domain

1. In Cloudflare, bind a custom domain to the R2 bucket (e.g. `media.humanrightsagenda.org`).
2. Set `R2_PUBLIC_BASE_URL=https://media.humanrightsagenda.org`.
3. Redeploy so `next.config` picks up the host for `images.remotePatterns`.

## CORS (browser PDF download)

Uploads are server-side; CORS is **not** required for admin uploads.

PDF **download** on the public site fetches the file in the browser. Same-origin `/api/media` URLs need no CORS. Cross-origin R2 public URLs need a bucket CORS policy allowing GET from your origins, for example:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://humanrightsagenda.org"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Content-Type", "Content-Length", "Content-Disposition"],
    "MaxAgeSeconds": 3600
  }
]
```

Do not allow `PUT`/`DELETE` from browsers.

## Security considerations

- Only administrators can upload/replace/delete CMS media.
- Server validates type (magic bytes) and size; path traversal rejected.
- Orphan delete only removes objects with no remaining DB references.
- R2 secrets must never appear in client bundles, API JSON, or logs.
- `STORAGE_PROVIDER=r2` fails closed if configuration is missing (no silent local fallback for new uploads).

## Testing

```bash
npm run media:test-r2          # put/head/delete temp object
npm run media:migrate-r2       # dry-run report
npm run typecheck
npm run lint
npm run test
npm run build
```

Manual admin checks (with `STORAGE_PROVIDER=r2`):

1. Publication main + gallery + PDF  
2. Event main + gallery  
3. Founder profile image  
4. Replace / delete image  
5. Reorder gallery (no re-upload)  
6. Reject wrong MIME / oversized files / >10 images  
7. Unauthenticated upload → 401  
8. Public pages + OG image URLs  

## Deployment checklist

- [ ] R2 bucket created; public access or custom domain configured  
- [ ] API token with object read/write  
- [ ] All `R2_*` vars set in the host (Vercel/etc.)  
- [ ] `STORAGE_PROVIDER=r2`  
- [ ] `R2_PUBLIC_BASE_URL` matches the public host  
- [ ] CORS set if PDF download uses the public R2 origin  
- [ ] `npm run media:test-r2` succeeds in that environment  
- [ ] Migrate existing local media if any  
- [ ] Smoke-test admin uploads and public pages (AR + EN)  

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| 503 “R2 is not configured” | Missing `R2_*` env var |
| 503 credentials rejected | Wrong access key / secret / account |
| 503 bucket not found | Wrong `R2_BUCKET_NAME` |
| Images 404 on CDN | Object missing; run migration or check key prefix |
| Legacy images 404 | File not under `UPLOAD_DIR` and not on R2 |
| PDF download fails in browser | Missing R2 CORS for your site origin |
| next/image blocked | `R2_PUBLIC_BASE_URL` host not loaded into `remotePatterns` (restart after env change) |

## Code map

| Path | Role |
| --- | --- |
| `src/server/storage/r2.ts` | R2 `StorageProvider` |
| `src/server/storage/r2-env.ts` | Env validation (app + CLI) |
| `src/server/storage/keys.ts` | Safe keys + purpose folders |
| `src/server/storage/index.ts` | Provider selection |
| `src/server/services/media.ts` | Upload + orphan cleanup |
| `src/app/api/admin/media/upload/route.ts` | Admin multipart upload |
| `src/app/api/media/[...key]/route.ts` | Access-checked delivery / legacy |
| `scripts/migrate-media-to-r2.ts` | Local → R2 migration |
| `scripts/test-r2-connection.ts` | Connection smoke test |
