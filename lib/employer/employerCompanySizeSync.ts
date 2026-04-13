/**
 * `employer_profiles.company_size` exists only after DB migration. PostgREST errors if the
 * column is missing or its schema cache is stale.
 *
 * Opt-in: set `NEXT_PUBLIC_EMPLOYER_COMPANY_SIZE_SYNC=1` in `.env.local` / Vercel **after**
 * running `supabase/scripts/fix-employer-company-size.sql` (or migration 20260413).
 * When unset or not `1`, reads/writes skip `company_size` so onboarding and account pages work.
 */
export const EMPLOYER_COMPANY_SIZE_DB_ENABLED =
  process.env.NEXT_PUBLIC_EMPLOYER_COMPANY_SIZE_SYNC === "1";

export function employerCompanySizeField(companySizeTrimmed: string): { company_size?: string | null } {
  if (!EMPLOYER_COMPANY_SIZE_DB_ENABLED) return {};
  return { company_size: companySizeTrimmed || null };
}

/** Server + client: employer account page load */
export function employerProfileSelectColumns(): string {
  const base =
    "id, company_name, registry_code, contact_email, contact_phone, website, company_description, location, industry, logo_url";
  return EMPLOYER_COMPANY_SIZE_DB_ENABLED ? `${base}, company_size` : base;
}

/** Client: onboarding prefill */
export function employerOnboardingSelectColumns(): string {
  const base =
    "company_name,registry_code,contact_email,contact_phone,website,location,industry,company_description,logo_url";
  return EMPLOYER_COMPANY_SIZE_DB_ENABLED ? `${base},company_size` : base;
}

/** Row shape for employer onboarding prefill (dynamic select string widens Supabase types). */
export type EmployerOnboardingPrefill = {
  company_name?: string | null;
  registry_code?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  location?: string | null;
  industry?: string | null;
  company_description?: string | null;
  company_size?: string | null;
  logo_url?: string | null;
};
