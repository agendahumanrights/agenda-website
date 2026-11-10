/**
 * Shared YouTube URL parsing / normalization for admin + public embeds.
 * Stores a canonical watch URL; embeds via youtube-nocookie.com.
 */

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/** Standard YouTube video IDs are 11 URL-safe Base64 characters. */
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export type ParsedYouTubeVideo = {
  videoId: string;
  /** Canonical watch URL stored in the database. */
  canonicalUrl: string;
  /** Privacy-enhanced embed URL for iframes. */
  embedUrl: string;
};

function sanitizeVideoId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const id = raw.trim().split(/[?#&]/)[0] ?? "";
  return VIDEO_ID_RE.test(id) ? id : null;
}

/**
 * Extract a YouTube video ID from common URL shapes.
 * Returns null for empty input, non-YouTube hosts, or malformed IDs.
 */
export function extractYouTubeVideoId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  if (host === "youtu.be" || host === "www.youtu.be") {
    const segment = url.pathname.split("/").filter(Boolean)[0];
    return sanitizeVideoId(segment);
  }

  const fromQuery = sanitizeVideoId(url.searchParams.get("v"));
  if (fromQuery) return fromQuery;

  const parts = url.pathname.split("/").filter(Boolean);
  const kind = parts[0]?.toLowerCase();
  if (
    kind === "embed" ||
    kind === "shorts" ||
    kind === "live" ||
    kind === "v" ||
    kind === "e"
  ) {
    return sanitizeVideoId(parts[1]);
  }

  return null;
}

export function parseYouTubeUrl(raw: string): ParsedYouTubeVideo | null {
  const videoId = extractYouTubeVideoId(raw);
  if (!videoId) return null;
  return {
    videoId,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
  };
}

/** Normalize to canonical watch URL, or null for empty/invalid. */
export function normalizeYouTubeUrl(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return parseYouTubeUrl(trimmed)?.canonicalUrl ?? null;
}

export function isValidYouTubeUrl(raw: string): boolean {
  return parseYouTubeUrl(raw) !== null;
}
