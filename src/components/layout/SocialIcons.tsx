import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M14 8.5h2.25V5.75H14c-2.07 0-3.75 1.68-3.75 3.75V12H8v2.75h2.25V21H14v-6.25h2.1L16.5 12H14V9.5c0-.55.45-1 1-1Z" />
    </svg>
  );
}

export function LinkedInIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M6.94 8.5H4.25V19.75h2.69V8.5ZM5.6 4.25a1.56 1.56 0 1 0 0 3.12 1.56 1.56 0 0 0 0-3.12ZM19.75 19.75h-2.69v-5.53c0-1.32-.02-3.01-1.84-3.01-1.84 0-2.12 1.44-2.12 2.92v5.62H10.4V8.5h2.58v1.54h.04c.36-.68 1.24-1.4 2.55-1.4 2.73 0 3.23 1.8 3.23 4.14v6.97Z" />
    </svg>
  );
}

export function YouTubeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.91C18.05 5 12 5 12 5s-6.05 0-7.7.29A2.7 2.7 0 0 0 2.4 7.2 28.3 28.3 0 0 0 2.1 12a28.3 28.3 0 0 0 .3 4.8 2.7 2.7 0 0 0 1.9 1.91C5.95 19 12 19 12 19s6.05 0 7.7-.29a2.7 2.7 0 0 0 1.9-1.91c.2-1.55.3-3.17.3-4.8s-.1-3.25-.3-4.8ZM10.2 14.85v-5.7L15.15 12l-4.95 2.85Z" />
    </svg>
  );
}
