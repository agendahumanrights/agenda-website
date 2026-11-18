-- Separate optional English / Arabic PDF attachments for publications.
-- Legacy single `pdfId` values are copied to `pdfEnId` so existing English
-- public pages keep working. Administrators should verify each record and
-- attach a dedicated Arabic PDF (or reassign) when needed.

ALTER TABLE "Publication" ADD COLUMN "pdfEnId" TEXT;
ALTER TABLE "Publication" ADD COLUMN "pdfArId" TEXT;

UPDATE "Publication" SET "pdfEnId" = "pdfId" WHERE "pdfId" IS NOT NULL;

ALTER TABLE "Publication" DROP CONSTRAINT "Publication_pdfId_fkey";

DROP INDEX IF EXISTS "Publication_pdfId_key";
DROP INDEX IF EXISTS "Publication_pdfId_idx";

ALTER TABLE "Publication" DROP COLUMN "pdfId";

CREATE UNIQUE INDEX "Publication_pdfEnId_key" ON "Publication"("pdfEnId");
CREATE UNIQUE INDEX "Publication_pdfArId_key" ON "Publication"("pdfArId");
CREATE INDEX "Publication_pdfEnId_idx" ON "Publication"("pdfEnId");
CREATE INDEX "Publication_pdfArId_idx" ON "Publication"("pdfArId");

ALTER TABLE "Publication" ADD CONSTRAINT "Publication_pdfEnId_fkey" FOREIGN KEY ("pdfEnId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_pdfArId_fkey" FOREIGN KEY ("pdfArId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
