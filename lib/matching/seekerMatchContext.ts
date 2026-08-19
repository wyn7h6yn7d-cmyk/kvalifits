import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { SeekerEligibilityInput } from "@/lib/employmentRules/types";
import type { SeekerCertificateInput, SeekerMatchInput } from "@/lib/matching/calculateJobMatch";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  calculateAgeYears,
  isLearningObligationStatus,
  minorAgeBandFromAge,
  type MinorAgeBand,
} from "@/lib/seeker/age";
import { experienceBackgroundFromDb } from "@/lib/seeker/experienceBackground";

const SEEKER_MATCH_SELECT =
  "full_name,profile_title,location,about,skills,skill_ids,profession_id,experience_level,preferred_job_types,preferred_locations,has_b_category_drivers_license,pref_full_time,pref_part_time,pref_remote_work,pref_hybrid_work,pref_on_site_work,pref_desired_weekly_hours,pref_min_weekly_hours,pref_max_weekly_hours,exp_seeking_first_job,exp_is_student,exp_has_internship,exp_has_volunteer,exp_has_project,exp_has_prior_work,experience_duration_years,languages,language_ids,date_of_birth,is_minor,minor_age_band,learning_obligation_status";

const SEEKER_MATCH_SELECT_CORE =
  "full_name,profile_title,location,about,skills,experience_level,preferred_job_types,preferred_locations,has_b_category_drivers_license,pref_full_time,pref_part_time,pref_remote_work,pref_hybrid_work,pref_on_site_work,pref_desired_weekly_hours,pref_min_weekly_hours,pref_max_weekly_hours,exp_seeking_first_job,exp_is_student,exp_has_internship,exp_has_volunteer,exp_has_project,exp_has_prior_work,experience_duration_years,languages";

const CERT_MATCH_SELECT = "certificate_name,certificate_issuer,certificate_valid_until,certificate_id";

export type SeekerMatchContext = {
  seeker: SeekerMatchInput | null;
  certs: SeekerCertificateInput[];
  /** Server-only legal eligibility input. Never sent to the client. */
  legal: SeekerEligibilityInput | null;
};

export const emptySeekerMatchContext: SeekerMatchContext = {
  seeker: null,
  certs: [],
  legal: null,
};

function asStringArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  const out = v.map((x) => String(x).trim()).filter(Boolean);
  return out.length ? out : [];
}

function seekerFromRow(row: Record<string, unknown>): SeekerMatchInput {
  return {
    profile_title: (row.profile_title ?? null) as string | null,
    full_name: (row.full_name ?? null) as string | null,
    location: (row.location ?? null) as string | null,
    about: (row.about ?? null) as string | null,
    skills: asStringArray(row.skills),
    experience_level: (row.experience_level ?? null) as string | null,
    preferred_job_types: asStringArray(row.preferred_job_types),
    preferred_locations: asStringArray(row.preferred_locations),
    has_b_category_drivers_license: (row.has_b_category_drivers_license ?? null) as boolean | null,
    experience_background: experienceBackgroundFromDb(
      row as Parameters<typeof experienceBackgroundFromDb>[0],
    ),
    languages: asStringArray(row.languages),
    language_ids: asStringArray(row.language_ids),
    skill_ids: asStringArray(row.skill_ids),
    profession_id: (row.profession_id ?? null) as string | null,
    pref_desired_weekly_hours: (row.pref_desired_weekly_hours ?? null) as number | null,
    pref_min_weekly_hours: (row.pref_min_weekly_hours ?? null) as number | null,
    pref_max_weekly_hours: (row.pref_max_weekly_hours ?? null) as number | null,
    pref_full_time: (row.pref_full_time ?? null) as boolean | null,
    pref_part_time: (row.pref_part_time ?? null) as boolean | null,
    pref_remote_work: (row.pref_remote_work ?? null) as boolean | null,
    pref_hybrid_work: (row.pref_hybrid_work ?? null) as boolean | null,
    pref_on_site_work: (row.pref_on_site_work ?? null) as boolean | null,
  };
}

function legalFromRow(row: Record<string, unknown> | null): SeekerEligibilityInput | null {
  if (!row) return null;
  const dob = (row.date_of_birth ?? "").toString().trim();
  const ageYears = dob ? calculateAgeYears(dob) : null;
  const learningRaw = row.learning_obligation_status ?? null;
  const bandRaw = row.minor_age_band;
  const band: MinorAgeBand | null =
    bandRaw === "under_15" || bandRaw === "age_15" || bandRaw === "age_16_17"
      ? bandRaw
      : minorAgeBandFromAge(ageYears);
  return {
    ageYears,
    isMinor: Boolean(row.is_minor) || (ageYears !== null && ageYears < 18),
    minorAgeBand: band,
    learningObligationStatus: isLearningObligationStatus(learningRaw) ? learningRaw : null,
  };
}

function certsFromRows(rows: unknown[] | null | undefined): SeekerCertificateInput[] {
  return (rows ?? []).map((c) => {
    const row = (c && typeof c === "object" ? c : {}) as Record<string, unknown>;
    return {
      certificate_name: (row.certificate_name ?? null) as string | null,
      certificate_issuer: (row.certificate_issuer ?? null) as string | null,
      certificate_valid_until: (row.certificate_valid_until ?? null) as string | null,
      certificate_id: (row.certificate_id ?? null) as string | null,
    };
  });
}

export async function loadSeekerMatchContextWithClient(
  supabase: SupabaseClient,
  userId: string,
): Promise<SeekerMatchContext> {
  if (!userId) return emptySeekerMatchContext;

  let seekerQuery = await supabase.from("seeker_profiles").select(SEEKER_MATCH_SELECT).eq("user_id", userId).maybeSingle();
  if (seekerQuery.error && /date_of_birth|is_minor|minor_age_band|learning_obligation|skill_ids|profession_id|language_ids|column/i.test(seekerQuery.error.message ?? "")) {
    seekerQuery = await supabase.from("seeker_profiles").select(SEEKER_MATCH_SELECT_CORE).eq("user_id", userId).maybeSingle();
  }

  let certRows: unknown[] | null = null;
  const certQuery = await supabase.from("seeker_certificates").select(CERT_MATCH_SELECT).eq("user_id", userId);
  if (certQuery.error && /certificate_id|column/i.test(certQuery.error.message ?? "")) {
    const fallback = await supabase
      .from("seeker_certificates")
      .select("certificate_name,certificate_issuer,certificate_valid_until")
      .eq("user_id", userId);
    certRows = fallback.data;
  } else {
    certRows = certQuery.data;
  }

  const row = (seekerQuery.data ?? null) as Record<string, unknown> | null;
  return {
    seeker: row ? seekerFromRow(row) : null,
    certs: certsFromRows(certRows),
    legal: legalFromRow(row),
  };
}

/** One seeker profile + compact certs per request. Date of birth stays server-side. */
export const loadSeekerMatchContext = cache(async (userId: string): Promise<SeekerMatchContext> => {
  if (!userId) return emptySeekerMatchContext;
  const supabase = await createSupabaseServerClient();
  return loadSeekerMatchContextWithClient(supabase, userId);
});
