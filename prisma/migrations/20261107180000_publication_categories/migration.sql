-- Rename legacy enum so the PublicationCategory table can reuse the name.
ALTER TYPE "PublicationCategory" RENAME TO "PublicationCategoryEnum";

-- CreateTable
CREATE TABLE "PublicationCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "requiresAuthor" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicationCategory_slug_key" ON "PublicationCategory"("slug");
CREATE UNIQUE INDEX "PublicationCategory_nameEn_key" ON "PublicationCategory"("nameEn");
CREATE UNIQUE INDEX "PublicationCategory_nameAr_key" ON "PublicationCategory"("nameAr");
CREATE INDEX "PublicationCategory_sortOrder_idx" ON "PublicationCategory"("sortOrder");

-- Seed the four former enum values (stable slugs preserve public ?category= filters).
INSERT INTO "PublicationCategory" ("id", "slug", "nameEn", "nameAr", "requiresAuthor", "sortOrder", "createdAt", "updatedAt") VALUES
('cpubcat000000000000000001', 'REPORT', 'Reports', 'تقارير', false, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cpubcat000000000000000002', 'BLOG', 'Blogs', 'مدونات', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cpubcat000000000000000003', 'PAPER', 'Papers', 'أوراق', false, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cpubcat000000000000000004', 'BRIEFING', 'Briefings', 'إحاطات', false, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable: map publications onto category rows
ALTER TABLE "Publication" ADD COLUMN "categoryId" TEXT;

UPDATE "Publication" AS p
SET "categoryId" = c."id"
FROM "PublicationCategory" AS c
WHERE c."slug" = p."category"::text;

ALTER TABLE "Publication" ALTER COLUMN "categoryId" SET NOT NULL;

-- Drop legacy enum column + type
DROP INDEX IF EXISTS "Publication_category_status_idx";
ALTER TABLE "Publication" DROP COLUMN "category";
DROP TYPE "PublicationCategoryEnum";

ALTER TABLE "Publication" ADD CONSTRAINT "Publication_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "PublicationCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Publication_categoryId_status_idx" ON "Publication"("categoryId", "status");
