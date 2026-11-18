import type { ReactNode } from "react";

import type {
  AboutTimelineIconId,
  AboutValueIconId,
} from "@/content/about";
import { cn } from "@/lib/utils";

function SvgShell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("size-6 text-[var(--brand-blue)]", className)}
    >
      {children}
    </svg>
  );
}

export function AboutTimelineIcon({
  id,
  className,
}: {
  id: AboutTimelineIconId;
  className?: string;
}) {
  switch (id) {
    case "civic-space":
      return (
        <SvgShell className={className}>
          <path
            d="M4 20V9.5L12 4l8 5.5V20"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9 20v-6h6v6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </SvgShell>
      );
    case "community-agency":
      return (
        <SvgShell className={className}>
          <circle cx="9" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16" cy="9" r="2.1" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M4.5 18.5c.6-2.6 2.5-4 4.5-4s3.9 1.4 4.5 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M13.2 14.6c.7-.4 1.6-.6 2.8-.6 1.9 0 3.5 1 4.1 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </SvgShell>
      );
    case "capacity":
      return (
        <SvgShell className={className}>
          <path
            d="M12 3.5v3.2M12 17.3V20.5M4.8 12H8M16 12h3.2M6.4 6.4l2.2 2.2M15.4 15.4l2.2 2.2M17.6 6.4l-2.2 2.2M8.6 15.4l-2.2 2.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
        </SvgShell>
      );
    case "accountability-justice":
      return (
        <SvgShell className={className}>
          <circle cx="11" cy="13" r="6.2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="11" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="11" cy="13" r="1.1" fill="currentColor" />
          <path
            d="M15.2 8.8 20 4M17.2 4h2.8v2.8M14.35 9.65l1.7-1.7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </SvgShell>
      );
    case "civic-society":
      return (
        <SvgShell className={className}>
          <circle cx="8.5" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="15.5" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="14.5" r="2.2" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M4.8 18.2c.5-2 2-3.1 3.7-3.1M19.2 18.2c-.5-2-2-3.1-3.7-3.1M9.2 19c.6-1.5 1.6-2.3 2.8-2.3s2.2.8 2.8 2.3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </SvgShell>
      );
    case "advocacy":
      return (
        <SvgShell className={className}>
          <path
            d="M5 19V6.5A1.5 1.5 0 0 1 6.5 5H14l5 5v9A1.5 1.5 0 0 1 17.5 19H5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M14 5v4h4M8.5 12.5h7M8.5 15.5h5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </SvgShell>
      );
    case "victims":
      return (
        <SvgShell className={className}>
          <path
            d="M12 20.5s-6.5-3.8-6.5-9A3.8 3.8 0 0 1 12 8.2 3.8 3.8 0 0 1 18.5 11.5c0 5.2-6.5 9-6.5 9Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12.2" r="1.6" fill="currentColor" />
        </SvgShell>
      );
    case "evidence":
      return (
        <SvgShell className={className}>
          <path
            d="M7 4.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V6A1.5 1.5 0 0 1 7 4.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M14 4.5V9h4.5M8.5 12.5H15M8.5 15.5h4.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </SvgShell>
      );
    default:
      return null;
  }
}

export function AboutValueIcon({
  id,
  className,
}: {
  id: AboutValueIconId;
  className?: string;
}) {
  switch (id) {
    case "independence":
      return (
        <SvgShell className={className}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 7.5v5l3 2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </SvgShell>
      );
    case "non-violence":
      return (
        <SvgShell className={className}>
          <path
            d="M12 4.5 18.5 8v4.8c0 4-2.8 6.7-6.5 7.7-3.7-1-6.5-3.7-6.5-7.7V8L12 4.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9.2 12.2 11 14l3.8-3.8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </SvgShell>
      );
    case "integrity":
      return (
        <SvgShell className={className}>
          <path
            d="M8 4.5h8v15l-4-2.2-4 2.2v-15Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M10 10h4M10 13h4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </SvgShell>
      );
    case "equality":
      return (
        <SvgShell className={className}>
          <path
            d="M7 8h10M7 16h10M9.5 8v8M14.5 8v8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </SvgShell>
      );
    case "synergy":
      return (
        <SvgShell className={className}>
          <circle cx="8.5" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="15.5" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="15.5" r="2.3" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M10.4 10.2 11.2 13.4M13.6 10.2 12.8 13.4M10.8 9h2.4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </SvgShell>
      );
    case "public-interest":
      return (
        <SvgShell className={className}>
          <path
            d="M12 20.5s-6.2-3.7-6.2-8.6A3.6 3.6 0 0 1 12 8.7a3.6 3.6 0 0 1 6.2 3.2c0 4.9-6.2 8.6-6.2 8.6Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M12 4.5v2.4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </SvgShell>
      );
    case "do-no-harm":
      return (
        <SvgShell className={className}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 8v4M12 15.8h.01"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </SvgShell>
      );
    case "accountability":
      return (
        <SvgShell className={className}>
          <path
            d="M5 12.5 9.2 16.5 19 7.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </SvgShell>
      );
    default:
      return null;
  }
}
