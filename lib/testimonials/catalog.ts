import type { TestimonialEntry } from "@/lib/testimonials/types";

/**
 * Static testimonial catalog.
 *
 * Intentionally empty in production until real approved stories exist.
 * To publish later, append an entry with `approved: true`, a real licensed
 * photo under `public/marketing/testimonials/`, and first-name-only attribution.
 *
 * Example shape (do not uncomment with fake names):
 *
 * {
 *   id: "story-1",
 *   firstName: "…",
 *   role: "Elektrik",
 *   quote: "Leidsin tööpakkumise, kus nägin kohe, millised nõuded mul täidetud olid.",
 *   company: "…", // optional
 *   photoPath: "/marketing/testimonials/….jpg",
 *   approved: true,
 *   locales: ["et", "en", "ru"],
 * }
 */
export const TESTIMONIAL_ENTRIES: readonly TestimonialEntry[] = [];
