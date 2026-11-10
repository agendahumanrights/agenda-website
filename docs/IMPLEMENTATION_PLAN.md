# Agenda — Implementation Plan (post–Phase 1)

Phase 1 (this foundation) is complete when the scaffold builds, Prisma validates/generates, and public shells render without a database. **Do not treat unfinished features as done.**

Localization uses **English unmarked URLs** and **Arabic `/ar` prefixes**, plus cookie `agenda_locale` for the switcher/admin. Legacy `?lang=ar` redirects to `/ar/...`; `/en` redirects to unmarked.

## Recommended next step

**Production storage adapter** (persistent volume or cloud object store), then organization vision/mission content, then design polish.

---

## Completed modules

| Module | Status |
| --- | --- |
| Phase 2 Auth | **Done** |
| Publications admin + homepage pubs | **Done** |
| Events admin + homepage events (max 3) | **Done** |
| Founders admin + About Us biographies | **Done** (scope update vs original PDF §2.5) |

## Remaining

| Area | Status |
| --- | --- |
| Production object storage / persistent uploads | Pending |
| About Us vision / mission / org intro copy | Pending (still outside admin) |
| Public catalogue filter UI wiring | Partial (APIs support filters) |
| Design polish & RTL QA | Pending |

---

## Dependency sketch

```
Phase 1 Foundation
    └─► Phase 2 Auth
            ├─► Publications ✓
            ├─► Events ✓
            └─► Founders ✓
                    ├─► Production storage
                    └─► Design polish
```
