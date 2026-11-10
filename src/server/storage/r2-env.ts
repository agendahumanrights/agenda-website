/**
 * Cloudflare R2 environment helpers (safe to import from CLI scripts).
 * Do not log credential values.
 */

export type R2EnvConfig = {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  region: string;
  publicBaseUrl: string;
};

export class R2ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "R2ConfigError";
  }
}

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new R2ConfigError(
      `Cloudflare R2 is not configured (${name} is missing).`,
    );
  }
  return value;
}

/** Load and validate R2 env vars. Never returns or logs secret values. */
export function loadR2EnvConfig(): R2EnvConfig {
  const accountId = readRequiredEnv("R2_ACCOUNT_ID");
  const bucket = readRequiredEnv("R2_BUCKET_NAME");
  const accessKeyId = readRequiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = readRequiredEnv("R2_SECRET_ACCESS_KEY");
  const endpoint = readRequiredEnv("R2_ENDPOINT");
  const region = (process.env.R2_REGION?.trim() || "auto").toLowerCase() || "auto";
  const publicBaseUrl = readRequiredEnv("R2_PUBLIC_BASE_URL").replace(
    /\/+$/,
    "",
  );

  try {
    const endpointUrl = new URL(endpoint);
    if (endpointUrl.protocol !== "https:") {
      throw new R2ConfigError("R2_ENDPOINT must use HTTPS.");
    }
  } catch (error) {
    if (error instanceof R2ConfigError) throw error;
    throw new R2ConfigError("R2_ENDPOINT is not a valid URL.");
  }

  try {
    const publicUrl = new URL(publicBaseUrl);
    if (publicUrl.protocol !== "https:" && publicUrl.protocol !== "http:") {
      throw new R2ConfigError("R2_PUBLIC_BASE_URL must be an absolute URL.");
    }
  } catch (error) {
    if (error instanceof R2ConfigError) throw error;
    throw new R2ConfigError("R2_PUBLIC_BASE_URL is not a valid URL.");
  }

  return {
    accountId,
    bucket,
    accessKeyId,
    secretAccessKey,
    endpoint,
    region,
    publicBaseUrl,
  };
}

/** Parse hostname from R2_PUBLIC_BASE_URL for next/image remotePatterns. */
export function parseR2PublicHostname(
  baseUrl = process.env.R2_PUBLIC_BASE_URL,
): { protocol: "http" | "https"; hostname: string; port: string } | null {
  const raw = baseUrl?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const protocol =
      url.protocol === "http:"
        ? "http"
        : url.protocol === "https:"
          ? "https"
          : null;
    if (!protocol || !url.hostname) return null;
    return { protocol, hostname: url.hostname, port: url.port || "" };
  } catch {
    return null;
  }
}
