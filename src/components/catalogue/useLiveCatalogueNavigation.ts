"use client";

import { useEffect, useRef } from "react";

import { catalogueSearchDelayMs } from "@/lib/catalogue-live-search";
import { useCatalogueLive } from "@/components/catalogue/CatalogueLiveContext";

type AppliedBase = {
  q?: string;
};

/**
 * Debounced URL replace for catalogue search, with generation tokens so
 * clear/category/reset/Enter cannot be overwritten by an outdated debounce.
 */
export function useLiveCatalogueNavigation<TApplied extends AppliedBase>(options: {
  buildHref: (draft: TApplied & { page?: number }) => string;
  sameCriteria: (a: TApplied, b: TApplied) => boolean;
}) {
  const { replaceHref } = useCatalogueLive();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationRef = useRef(0);
  const lastSentRef = useRef<TApplied | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      generationRef.current += 1;
    };
  }, []);

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  /** Cancel pending debounce and navigate immediately (page resets to 1). */
  function applyNow(next: TApplied) {
    clearTimer();
    generationRef.current += 1;
    lastSentRef.current = next;
    replaceHref(options.buildHref({ ...next, page: 1 }));
  }

  /** Schedule a search update; empty query runs immediately. */
  function scheduleSearch(next: TApplied, draftQuery: string) {
    clearTimer();
    const generation = ++generationRef.current;
    const delay = catalogueSearchDelayMs(draftQuery);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (generation !== generationRef.current) return;
      lastSentRef.current = next;
      replaceHref(options.buildHref({ ...next, page: 1 }));
    }, delay);
  }

  function wasSentByUs(applied: TApplied): boolean {
    return (
      lastSentRef.current !== null &&
      options.sameCriteria(applied, lastSentRef.current)
    );
  }

  /** URL changed from chips / Back / Forward — align bookkeeping and cancel debounce. */
  function noteExternalApplied(applied: TApplied) {
    lastSentRef.current = applied;
    clearTimer();
    generationRef.current += 1;
  }

  return {
    applyNow,
    scheduleSearch,
    wasSentByUs,
    noteExternalApplied,
  };
}
