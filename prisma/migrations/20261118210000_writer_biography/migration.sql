-- Add localized Markdown biography for writers (legacy rows default to empty).
ALTER TABLE "WriterTranslation"
ADD COLUMN "biography" TEXT NOT NULL DEFAULT '';
