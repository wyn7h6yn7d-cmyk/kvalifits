import { safeHttpUrl } from "@/lib/utils";

export const PUBLIC_COMPANY_SELECT =
  "id,public_slug,company_name,logo_url,location,industry,website,company_description,company_verified";

export const PUBLIC_COMPANY_SELECT_LEGACY =
  "id,company_name,logo_url,location,industry,website,company_description,company_verified";

export type PublicCompany = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  location: string | null;
  industry: string | null;
  website: string | null;
  description: string | null;
  verified: boolean;
};

export function isMissingDbObjectError(message: string | undefined): boolean {
  return /does not exist|schema cache|relation|could not find|column/i.test(message ?? "");
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

function trimOrNull(v: unknown): string | null {
  const s = (v ?? "").toString().trim();
  return s || null;
}

/** Map a directory row. Never treat a name as verification. */
export function mapPublicCompanyRow(row: Record<string, unknown>): PublicCompany | null {
  const id = (row.id ?? "").toString().trim();
  const name = (row.company_name ?? "").toString().trim();
  if (!id || !name) return null;
  const slug = (row.public_slug ?? "").toString().trim() || id;
  return {
    id,
    slug,
    name,
    logoUrl: safeHttpUrl(row.logo_url),
    location: trimOrNull(row.location),
    industry: trimOrNull(row.industry),
    website: safeHttpUrl(row.website),
    description: trimOrNull(row.company_description),
    verified: row.company_verified === true,
  };
}

export function foldSearchText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function uniqueSorted(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const v of values) {
    const s = (v ?? "").trim();
    if (s) set.add(s);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "et"));
}
