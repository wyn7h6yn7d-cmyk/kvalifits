/**
 * Homepage / marketing testimonials (success stories).
 *
 * Production rule: never invent quotes or real-looking user names.
 * Only `approved: true` entries with complete fields may render.
 */

export type TestimonialLocale = "et" | "en" | "ru";

/** Draft or approved entry stored in the static catalog. */
export type TestimonialEntry = {
  id: string;
  /** Given name only — no full legal name required. */
  firstName: string;
  /** Job title / occupation shown under the name. */
  role: string;
  /** Short first-person quote. */
  quote: string;
  /** Optional company name. */
  company?: string;
  /** Public path under `/public`, e.g. `/marketing/testimonials/mari.jpg`. */
  photoPath: string;
  /**
   * Explicit publication gate. Must be `true` for production render.
   * Keep drafts as `false` until legal/comms approval.
   */
  approved: boolean;
  /** Locales where this quote may appear. Use all three when copy is shared. */
  locales: readonly TestimonialLocale[];
};

/** Narrowed shape after guards — safe to render. */
export type ApprovedTestimonial = {
  id: string;
  firstName: string;
  role: string;
  quote: string;
  company?: string;
  photoPath: string;
  approved: true;
  locales: readonly TestimonialLocale[];
};
