import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { stripLocalePrefix } from "@/i18n/pathnames";
import {
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  LOCALE_HEADER_NAME,
} from "@/i18n/locale-cookie";
import {
  isLocaleQueryValue,
  LANG_QUERY_PARAM,
  URL_DEFAULT_LOCALE,
} from "@/lib/seo/locale-url";

/**
 * Next.js 16 Proxy:
 * - Redirect legacy `/ar/...` and `/en/...` to unprefixed paths (+ `?lang=`).
 * - Canonicalize `?lang=en` → unmarked English URL.
 * - Forward `lang` query as `x-agenda-lang` and sync the language cookie.
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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPassthrough(pathname)) {
    return NextResponse.next();
  }

  const { locale: prefixLocale, pathname: unprefixed } =
    stripLocalePrefix(pathname);

  // Legacy `/ar` / `/en` prefixes → unprefixed + query lang for Arabic.
  if (prefixLocale) {
    const url = request.nextUrl.clone();
    url.pathname = unprefixed;
    if (prefixLocale === URL_DEFAULT_LOCALE) {
      url.searchParams.delete(LANG_QUERY_PARAM);
    } else {
      url.searchParams.set(LANG_QUERY_PARAM, prefixLocale);
    }
    const response = NextResponse.redirect(url);
    return withLocaleCookie(response, prefixLocale);
  }

  const langParam = request.nextUrl.searchParams.get(LANG_QUERY_PARAM);

  // `?lang=en` → clean English URL (unmarked).
  if (langParam === URL_DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.searchParams.delete(LANG_QUERY_PARAM);
    const response = NextResponse.redirect(url);
    return withLocaleCookie(response, URL_DEFAULT_LOCALE);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-agenda-pathname", pathname);

  if (isLocaleQueryValue(langParam)) {
    requestHeaders.set(LOCALE_HEADER_NAME, langParam);
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    return withLocaleCookie(response, langParam);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
