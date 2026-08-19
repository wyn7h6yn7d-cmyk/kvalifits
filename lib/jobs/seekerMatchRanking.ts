import type { SeekerMatchInput } from "@/lib/matching/calculateJobMatch";

/**
 * Ranking-sort signal only: enough profile text to score a match.
 * Apply / onboarding eligibility is `seekerCoreComplete` in
 * `lib/seeker/profileCompleteness.ts` — do not treat this as that gate.
 */
export function seekerCanUseMatchRanking(seeker: SeekerMatchInput | null | undefined): boolean {
  if (!seeker) return false;
  const skills = (seeker.skills ?? []).map((s) => String(s).trim()).filter(Boolean);
  const title = (seeker.profile_title ?? "").trim();
  const exp = (seeker.experience_level ?? "").trim();
  const location = (seeker.location ?? "").trim();
  const signalCount = [skills.length > 0, Boolean(title), Boolean(exp), Boolean(location)].filter(Boolean)
    .length;
  return signalCount >= 2 && (skills.length > 0 || Boolean(title));
}
