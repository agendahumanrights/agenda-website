export type ApiErrorPayload = {
  error?: { code?: string; message?: string; details?: unknown };
};

export async function adminJson<T>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; payload: ApiErrorPayload }> {
  const res = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  const payload = (await res.json().catch(() => ({}))) as T & ApiErrorPayload;
  if (!res.ok) {
    return { ok: false, status: res.status, payload };
  }
  return { ok: true, data: payload as T };
}
