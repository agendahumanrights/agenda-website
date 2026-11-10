-- Speed up /api/media public-access checks that filter by FK columns alone.
CREATE INDEX IF NOT EXISTS "Publication_mainImageId_idx" ON "Publication"("mainImageId");
CREATE INDEX IF NOT EXISTS "Publication_pdfId_idx" ON "Publication"("pdfId");
CREATE INDEX IF NOT EXISTS "PublicationGalleryImage_mediaAssetId_idx" ON "PublicationGalleryImage"("mediaAssetId");
CREATE INDEX IF NOT EXISTS "Event_mainImageId_idx" ON "Event"("mainImageId");
CREATE INDEX IF NOT EXISTS "EventGalleryImage_mediaAssetId_idx" ON "EventGalleryImage"("mediaAssetId");
