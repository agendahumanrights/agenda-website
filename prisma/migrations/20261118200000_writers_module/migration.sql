-- Writers module: independent publication authors + migrate founder authors → writers.

-- CreateTable
CREATE TABLE "Writer" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "socialLinks" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileImageId" TEXT,

    CONSTRAINT "Writer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WriterTranslation" (
    "id" TEXT NOT NULL,
    "writerId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "fullName" TEXT NOT NULL,
    "major" TEXT NOT NULL,

    CONSTRAINT "WriterTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Writer_slug_key" ON "Writer"("slug");
CREATE UNIQUE INDEX "Writer_profileImageId_key" ON "Writer"("profileImageId");
CREATE INDEX "Writer_email_idx" ON "Writer"("email");
CREATE INDEX "WriterTranslation_locale_idx" ON "WriterTranslation"("locale");
CREATE UNIQUE INDEX "WriterTranslation_writerId_locale_key" ON "WriterTranslation"("writerId", "locale");

-- AddForeignKey
ALTER TABLE "Writer" ADD CONSTRAINT "Writer_profileImageId_fkey" FOREIGN KEY ("profileImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WriterTranslation" ADD CONSTRAINT "WriterTranslation_writerId_fkey" FOREIGN KEY ("writerId") REFERENCES "Writer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: add writer author FK (keep founder FK until data is copied)
ALTER TABLE "Publication" ADD COLUMN "authorWriterId" TEXT;

-- Migrate distinct founder authors → writers (reuse founder id for stable remapping)
INSERT INTO "Writer" ("id", "slug", "email", "socialLinks", "profileImageId", "createdAt", "updatedAt")
SELECT DISTINCT ON (f."id")
  f."id",
  f."bioKey",
  f."email",
  '[]'::jsonb,
  f."profileImageId",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Founder" f
INNER JOIN "Publication" p ON p."authorFounderId" = f."id"
ORDER BY f."id";

INSERT INTO "WriterTranslation" ("id", "writerId", "locale", "fullName", "major")
SELECT
  'cwt' || substr(md5(ft."founderId" || ft."locale"::text), 1, 22),
  ft."founderId",
  ft."locale",
  ft."fullName",
  CASE
    WHEN length(trim(ft."professionalArea")) > 0 THEN ft."professionalArea"
    ELSE ft."fullName"
  END
FROM "FounderTranslation" ft
WHERE ft."founderId" IN (SELECT "id" FROM "Writer");

-- Remap publications to writers
UPDATE "Publication"
SET "authorWriterId" = "authorFounderId"
WHERE "authorFounderId" IS NOT NULL;

-- Drop founder author FK/column
DROP INDEX IF EXISTS "Publication_authorFounderId_idx";
ALTER TABLE "Publication" DROP CONSTRAINT IF EXISTS "Publication_authorFounderId_fkey";
ALTER TABLE "Publication" DROP COLUMN "authorFounderId";

-- Writer author FK + index
CREATE INDEX "Publication_authorWriterId_idx" ON "Publication"("authorWriterId");
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_authorWriterId_fkey" FOREIGN KEY ("authorWriterId") REFERENCES "Writer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
