"use client";

import {
  createContext,
  useCallback,
  useContext,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type CatalogueLiveContextValue = {
  /** Soft-navigate with history replace (typing / filter updates). */
  replaceHref: (href: string) => void;
  isPending: boolean;
};

const CatalogueLiveContext = createContext<CatalogueLiveContextValue | null>(
  null,
);

export function CatalogueLiveProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const replaceHref = useCallback(
    (href: string) => {
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [router],
  );

  return (
    <CatalogueLiveContext.Provider value={{ replaceHref, isPending }}>
      {children}
    </CatalogueLiveContext.Provider>
  );
}

export function useCatalogueLive(): CatalogueLiveContextValue {
  const value = useContext(CatalogueLiveContext);
  if (!value) {
    throw new Error("useCatalogueLive must be used within CatalogueLiveProvider");
  }
  return value;
}

type ResultsFrameProps = {
  children: ReactNode;
  loadingLabel: string;
};

/** Keeps current results visible while a soft navigation updates the RSC tree. */
export function CatalogueResultsFrame({
  children,
  loadingLabel,
}: ResultsFrameProps) {
  const { isPending } = useCatalogueLive();

  return (
    <div className="relative flex flex-col gap-6" aria-busy={isPending || undefined}>
      <div
        className="pointer-events-none absolute inset-x-0 -top-1 z-10 flex justify-center"
        aria-live="polite"
        aria-atomic="true"
      >
        {isPending ? (
          <span className="rounded-full border border-zinc-200 bg-white/95 px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
            {loadingLabel}
          </span>
        ) : (
          <span className="sr-only">{loadingLabel}</span>
        )}
      </div>
      <div
        className={
          isPending
            ? "opacity-60 transition-opacity duration-150"
            : "opacity-100 transition-opacity duration-150"
        }
      >
        {children}
      </div>
    </div>
  );
}
