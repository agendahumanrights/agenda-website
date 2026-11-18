/**
 * Page-hero framed media. Publications/Events catalogues use `LatestContentHero`
 * when published content exists; empty catalogues omit `PageHero` media entirely.
 * About still uses the locale lockup via `organizationLogoPath`.
 */

export type PageHeroKey = "about";

export type PageHeroImageConfig = {
  /** Public path, e.g. `/images/agenda-logo-en.png` */
  src: string;
  /**
   * Accessible alt text. Empty string = decorative placeholder
   * (title/description are rendered as HTML in the hero).
   */
  alt: string;
  /** CSS object-position for photographs (e.g. `center top`). */
  objectPosition: string;
  /**
   * How the media fills the framed panel.
   * `contain` is used for the About logo mark.
   */
  fit?: "cover" | "contain";
};

export const PAGE_HEROES: Record<PageHeroKey, PageHeroImageConfig> = {
  about: {
    /** Overridden per-request with `organizationLogoPath(locale)` on the About page. */
    src: "/images/agenda-logo-en.png",
    alt: "",
    objectPosition: "center",
    fit: "contain",
  },
};
