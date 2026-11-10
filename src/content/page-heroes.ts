/**
 * Temporary page-hero images for catalogue / About introductions.
 * Replace the files under `public/images/heroes/` and adjust
 * `objectPosition` / `alt` here when final photography is ready.
 */

export type PageHeroKey = "publications" | "events" | "about";

export type PageHeroImageConfig = {
  /** Public path, e.g. `/images/heroes/publications-hero.svg` */
  src: string;
  /**
   * Accessible alt text. Empty string = decorative placeholder
   * (title/description are rendered as HTML in the hero).
   */
  alt: string;
  /** CSS object-position for photographs (e.g. `center top`). */
  objectPosition: string;
};

export const PAGE_HEROES: Record<PageHeroKey, PageHeroImageConfig> = {
  publications: {
    src: "/images/heroes/publications-hero.jpg",
    alt: "",
    objectPosition: "center",
  },
  events: {
    src: "/images/heroes/events-hero.jpg",
    alt: "",
    objectPosition: "center",
  },
  about: {
    src: "/images/heroes/about-hero.jpg",
    alt: "",
    objectPosition: "center",
  },
};
