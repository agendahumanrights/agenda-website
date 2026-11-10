import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { stripLocalePrefix } from "@/i18n/pathnames";
import {
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  LOCALE_HEADER_NAME,
} from "@/i18n/locale-cookie";
import {
  LANG_QUERY_PARAM,
  URL_DEFAULT_LOCALE,
} from "@/lib/seo/locale-url";

/**
 * Next.js 16 Proxy:
 * - Serve Arabic under `/ar/...` via rewrite to the unprefixed App Router tree.
 * - Redirect `/en/...` to unmarked English URLs.
 * - Redirect legacy `?lang=ar` → `/ar/...` and `?lang=en` → unmarked.
 * - Forward pathname for admin protected-layout redirect `next` param.
 * - Leave API and static assets alone.
 */

function isPassthrough(pathname: string): boolean {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  );
}

function withLocaleCookie(response: NextResponse, locale: string) {
  response.cookies.set({
    name: LOCALE_COOKIE_NAME,
    value: locale,
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
  });
  return response;
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPassthrough(pathname)) {
    return NextResponse.next();
  }

  const { locale: prefixLocale, pathname: unprefixed } =
    stripLocalePrefix(pathname);

  // `/en/...` → unmarked English (English has no path prefix).
  if (prefixLocale === "en") {
    const url = request.nextUrl.clone();
    url.pathname = unprefixed;
    url.searchParams.delete(LANG_QUERY_PARAM);
    const response = NextResponse.redirect(url);
    return withLocaleCookie(response, "en");
  }

  // `/ar/...` → rewrite to unprefixed routes; locale from path.
  if (prefixLocale === "ar") {
    const url = request.nextUrl.clone();
    url.pathname = unprefixed;
    url.searchParams.delete(LANG_QUERY_PARAM);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER_NAME, "ar");
    requestHeaders.set("x-agenda-pathname", unprefixed);

    const response = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    return withLocaleCookie(response, "ar");
  }

  const langParam = request.nextUrl.searchParams.get(LANG_QUERY_PARAM);

  // Legacy `?lang=ar` → `/ar/...`
  if (langParam === "ar") {
    const url = request.nextUrl.clone();
    url.pathname = unprefixed === "/" ? "/ar" : `/ar${unprefixed}`;
    url.searchParams.delete(LANG_QUERY_PARAM);
    const response = NextResponse.redirect(url);
    return withLocaleCookie(response, "ar");
  }

  // `?lang=en` → clean English URL (unmarked).
  if (langParam === URL_DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.searchParams.delete(LANG_QUERY_PARAM);
    const response = NextResponse.redirect(url);
    return withLocaleCookie(response, URL_DEFAULT_LOCALE);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-agenda-pathname", pathname);

  // Public unmarked URLs are English (header wins over cookie).
  // Do not overwrite the cookie here so admin UI can keep a separate preference.
  if (!isAdminPath(pathname)) {
    requestHeaders.set(LOCALE_HEADER_NAME, URL_DEFAULT_LOCALE);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
