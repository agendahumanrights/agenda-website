-- Multiple authors per publication (max 10 enforced in app).
-- Non-destructive data path: create join table, copy existing authorWriterId rows, then drop the single FK.

-- CreateTable
CREATE TABLE "PublicationWriter" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "writerId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PublicationWriter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicationWriter_publicationId_writerId_key" ON "PublicationWriter"("publicationId", "writerId");
CREATE INDEX "PublicationWriter_publicationId_sortOrder_idx" ON "PublicationWriter"("publicationId", "sortOrder");
CREATE INDEX "PublicationWriter_writerId_idx" ON "PublicationWriter"("writerId");

-- AddForeignKey
ALTER TABLE "PublicationWriter" ADD CONSTRAINT "PublicationWriter_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicationWriter" ADD CONSTRAINT "PublicationWriter_writerId_fkey" FOREIGN KEY ("writerId") REFERENCES "Writer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill existing single-author assignments (sortOrder = 0)
INSERT INTO "PublicationWriter" ("id", "publicationId", "writerId", "sortOrder")
SELECT
  'cpw' || substr(md5(p."id" || p."authorWriterId"), 1, 22),
  p."id",
  p."authorWriterId",
  0
FROM "Publication" p
WHERE p."authorWriterId" IS NOT NULL
ON CONFLICT ("publicationId", "writerId") DO NOTHING;

-- Drop legacy single-author column
DROP INDEX IF EXISTS "Publication_authorWriterId_idx";
ALTER TABLE "Publication" DROP CONSTRAINT IF EXISTS "Publication_authorWriterId_fkey";
ALTER TABLE "Publication" DROP COLUMN IF EXISTS "authorWriterId";
