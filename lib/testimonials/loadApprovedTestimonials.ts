import { existsSync } from "node:fs";
import path from "node:path";

import { TESTIMONIAL_ENTRIES } from "@/lib/testimonials/catalog";
import type {
  ApprovedTestimonial,
  TestimonialEntry,
  TestimonialLocale,
} from "@/lib/testimonials/types";

/**
 * Feature guard — off when `HOME_TESTIMONIALS_ENABLED=0|false|off`.
 * Default: enabled (data guard still hides empty/unapproved lists).
 */
export function isHomeTestimonialsEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const raw = (env.HOME_TESTIMONIALS_ENABLED ?? "1").trim().toLowerCase();
  return raw !== "0" && raw !== "false" && raw !== "off" && raw !== "no";
}

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function resolvePublicPhotoAbsolutePath(photoPath: string): string | null {
  if (!photoPath.startsWith("/")) return null;
  // Prevent path escape outside /public
  const normalized = path.posix.normalize(photoPath);
  if (normalized !== photoPath || normalized.includes("..")) return null;
  return path.join(process.cwd(), "public", normalized.slice(1));
}

/** Photo must exist on disk under /public for production render. */
export function testimonialPhotoExists(photoPath: string): boolean {
  const absolute = resolvePublicPhotoAbsolutePath(photoPath);
  if (!absolute) return false;
  try {
    return existsSync(absolute);
  } catch {
    return false;
  }
}

export function isApprovedTestimonial(
  entry: TestimonialEntry,
  options: { requirePhotoFile?: boolean } = {},
): entry is ApprovedTestimonial {
  if (entry.approved !== true) return false;
  if (!isNonEmpty(entry.id)) return false;
  if (!isNonEmpty(entry.firstName)) return false;
  if (!isNonEmpty(entry.role)) return false;
  if (!isNonEmpty(entry.quote)) return false;
  if (!isNonEmpty(entry.photoPath)) return false;
  if (entry.company !== undefined && !isNonEmpty(entry.company)) return false;
  if (!Array.isArray(entry.locales) || entry.locales.length === 0) return false;

  const requirePhotoFile = options.requirePhotoFile ?? true;
  if (requirePhotoFile && !testimonialPhotoExists(entry.photoPath)) return false;

  return true;
}

function normalizeLocale(locale: string): TestimonialLocale | null {
  if (locale === "et" || locale === "en" || locale === "ru") return locale;
  return null;
}

/**
 * Data + feature guard for homepage testimonials.
 * Returns [] when disabled, empty, unapproved, or missing photo files.
 */
export function getApprovedTestimonialsForLocale(
  locale: string,
  options: {
    entries?: readonly TestimonialEntry[];
    requirePhotoFile?: boolean;
    env?: NodeJS.ProcessEnv;
  } = {},
): ApprovedTestimonial[] {
  if (!isHomeTestimonialsEnabled(options.env)) return [];

  const localeKey = normalizeLocale(locale);
  if (!localeKey) return [];

  const entries = options.entries ?? TESTIMONIAL_ENTRIES;
  const requirePhotoFile = options.requirePhotoFile ?? true;

  return entries.filter(
    (entry): entry is ApprovedTestimonial =>
      isApprovedTestimonial(entry, { requirePhotoFile }) && entry.locales.includes(localeKey),
  );
}

/** True when the homepage section should render. */
export function shouldRenderHomeTestimonials(
  locale: string,
  options?: Parameters<typeof getApprovedTestimonialsForLocale>[1],
): boolean {
  return getApprovedTestimonialsForLocale(locale, options).length > 0;
}
