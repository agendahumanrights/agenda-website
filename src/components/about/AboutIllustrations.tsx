import { cn } from "@/lib/utils";

type IllustrationProps = {
  className?: string;
};

/** Decorative line-art illustrations for About sections (brand blue). */
export function VisionIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden
      className={cn("h-auto w-full max-w-[11rem] text-[var(--brand-blue)]", className)}
    >
      <circle cx="80" cy="80" r="54" stroke="currentColor" strokeWidth="3" />
      <circle cx="80" cy="80" r="36" stroke="currentColor" strokeWidth="3" />
      <circle cx="80" cy="80" r="14" fill="currentColor" />
      <path
        d="M80 18v18M80 124v18M18 80h18M124 80h18"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M112 42l18-14M130 28l-6 16 16-2"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MissionIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden
      className={cn("h-auto w-full max-w-[11rem] text-[var(--brand-blue)]", className)}
    >
      <rect
        x="34"
        y="28"
        width="72"
        height="96"
        rx="8"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M52 52h36M52 68h36M52 84h24"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="112" cy="108" r="26" stroke="currentColor" strokeWidth="3" />
      <path
        d="M100 108l8 8 16-18"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

