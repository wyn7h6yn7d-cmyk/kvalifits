import {
  isCarouselLogoStoragePath,
  isEmployerOriginalLogoStoragePath,
  resolveCarouselLogoPublicUrl,
} from "@/lib/employer/carouselLogo";
import { extractAvatarsStoragePathFromLogoUrl } from "@/lib/employer/carouselLogoPaths";

export type HomepageShowcaseDisplayMode = "transparent" | "plate";

export type HomepageShowcaseCompany = {
  id: string;
  slug: string;
  name: string;
  displayMode: HomepageShowcaseDisplayMode;
  logoUrl: string;
  website: string | null;
};

export function isHomepageShowcaseColumnMissing(message: string | undefined): boolean {
  return /show_on_homepage|homepage_logo_approved|carousel_logo_path|employer_show_on_homepage_profiles|column/i.test(
    message ?? "",
  );
}

function resolveLogoPublicUrl(value: string | null | undefined): string | null {
  const raw = (value ?? "").toString().trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return resolveCarouselLogoPublicUrl(raw);
}

function storageKeyFromPathOrUrl(value: string): string | null {
  const fromUrl = extractAvatarsStoragePathFromLogoUrl(value);
  if (fromUrl) return fromUrl;
  if (value.startsWith("http://") || value.startsWith("https://")) return null;
  return value.replace(/^\/+/, "") || null;
}

/** Decide how an approved homepage carousel row should render (or exclude it). */
export function resolveHomepageShowcaseLogo(row: {
  carousel_logo_path?: unknown;
  use_logo_plate?: unknown;
  logo_url?: unknown;
}): { displayMode: HomepageShowcaseDisplayMode; logoUrl: string } | null {
  const usePlate = Boolean(row.use_logo_plate);
  const carouselPath = (row.carousel_logo_path ?? "").toString().trim();
  const originalUrl = resolveLogoPublicUrl((row.logo_url ?? "").toString());

  if (usePlate) {
    if (!originalUrl) return null;
    return { displayMode: "plate", logoUrl: originalUrl };
  }

  if (!carouselPath) return null;

  const storageKey = storageKeyFromPathOrUrl(carouselPath);
  if (storageKey) {
    if (isEmployerOriginalLogoStoragePath(storageKey)) return null;
    if (!isCarouselLogoStoragePath(storageKey)) return null;
  }

  const carouselUrl = resolveLogoPublicUrl(carouselPath);
  if (!carouselUrl) return null;

  return { displayMode: "transparent", logoUrl: carouselUrl };
}

export function mapHomepageShowcaseRow(row: Record<string, unknown>): HomepageShowcaseCompany | null {
  const id = (row.id ?? "").toString().trim();
  const slug = (row.public_slug ?? "").toString().trim();
  const name = (row.company_name ?? "").toString().trim();
  const resolved = resolveHomepageShowcaseLogo(row);
  if (!id || !slug || !name || !resolved) return null;

  const websiteRaw = (row.website ?? "").toString().trim();
  return {
    id,
    slug,
    name,
    displayMode: resolved.displayMode,
    logoUrl: resolved.logoUrl,
    website: websiteRaw || null,
  };
}
