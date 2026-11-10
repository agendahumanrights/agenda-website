"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { isLocale, type Locale } from "@/i18n/config";
import {
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
} from "@/i18n/locale-cookie";

export async function setLocaleAction(locale: string): Promise<Locale> {
  if (!isLocale(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  const jar = await cookies();
  jar.set({
    name: LOCALE_COOKIE_NAME,
    value: locale,
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
  });

  // Invalidate layout so lang/dir and dictionaries refresh for this visitor.
  revalidatePath("/", "layout");
  return locale;
}
