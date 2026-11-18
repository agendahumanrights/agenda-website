-- Make Blogs author optional (same as other publication categories).
UPDATE "PublicationCategory"
SET "requiresAuthor" = false
WHERE "slug" = 'BLOG';
