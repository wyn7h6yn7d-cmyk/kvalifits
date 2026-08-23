/**
 * employer_profiles column classes for Data API reads.
 *
 * PUBLIC — company directory / job cards (anon, seeker, other employer)
 * OWNER_PRIVATE — operational contacts and unpublished company metadata
 * ADMIN_ONLY — verification admin metadata (admin: all rows; owner: own row)
 * SYSTEM — search indexes; not granted to anon/authenticated
 *
 * Logging in must not expand the public surface. Authenticated non-owners
 * see the same PUBLIC columns as anonymous users.
 */

export type EmployerProfileFieldClass = "public" | "owner_private" | "admin_only" | "system";

export const EMPLOYER_PROFILE_COLUMN_CLASS = {
  id: "public",
  public_slug: "public",
  company_name: "public",
  logo_url: "public",
  location: "public",
  industry: "public",
  industry_id: "public",
  website: "public",
  company_description: "public",
  company_verified: "public",
  verification_status: "public",

  show_on_homepage: "admin_only",
  homepage_logo_approved: "admin_only",
  carousel_logo_path: "admin_only",
  use_logo_plate: "admin_only",

  owner_user_id: "owner_private",
  registry_code: "owner_private",
  contact_email: "owner_private",
  contact_phone: "owner_private",
  company_size: "owner_private",
  created_at: "owner_private",
  updated_at: "owner_private",

  verification_source: "admin_only",
  verified_at: "admin_only",

  search_text: "system",
  search_tsv: "system",
} as const satisfies Record<string, EmployerProfileFieldClass>;

export type EmployerProfileColumn = keyof typeof EMPLOYER_PROFILE_COLUMN_CLASS;

export const EMPLOYER_PUBLIC_COLUMNS = (
  Object.keys(EMPLOYER_PROFILE_COLUMN_CLASS) as EmployerProfileColumn[]
).filter((column) => EMPLOYER_PROFILE_COLUMN_CLASS[column] === "public");

/** PostgREST select for public company cards. Omits industry_id (optional taxonomy). */
export const EMPLOYER_PUBLIC_SELECT =
  "id,public_slug,company_name,logo_url,location,industry,website,company_description,company_verified,verification_status";

export const EMPLOYER_PUBLIC_SELECT_LEGACY =
  "id,company_name,logo_url,location,industry,website,company_description,company_verified";

export const EMPLOYER_PRIVATE_READ_COLUMNS: EmployerProfileColumn[] = [
  "owner_user_id",
  "registry_code",
  "contact_email",
  "contact_phone",
  "company_size",
  "created_at",
  "updated_at",
  "verification_source",
  "verified_at",
];

export const EMPLOYER_SYSTEM_COLUMNS: EmployerProfileColumn[] = ["search_text", "search_tsv"];

export function publicSurfaceMaySelectColumn(column: EmployerProfileColumn): boolean {
  return EMPLOYER_PROFILE_COLUMN_CLASS[column] === "public";
}

/** Anon, authenticated seeker, and other employers share this surface. */
export function authenticatedNonOwnerMaySelectColumn(column: EmployerProfileColumn): boolean {
  return publicSurfaceMaySelectColumn(column);
}

export function ownerMaySelectColumn(column: EmployerProfileColumn): boolean {
  const cls = EMPLOYER_PROFILE_COLUMN_CLASS[column];
  return cls === "public" || cls === "owner_private" || cls === "admin_only";
}

export function adminMaySelectColumn(column: EmployerProfileColumn): boolean {
  return ownerMaySelectColumn(column);
}

export function loginMustNotExposeColumn(column: EmployerProfileColumn): boolean {
  return (
    publicSurfaceMaySelectColumn(column) === authenticatedNonOwnerMaySelectColumn(column) &&
    !publicSurfaceMaySelectColumn(column)
  );
}
