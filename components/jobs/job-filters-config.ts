import type { Job } from "@/components/jobs/types";

/**
 * Filtrite lähteandmed. Tulevikus: asenda profiili-põhine sektsioon API vastusega
 * (aggregaat populaarsematest profiiliväljadest), säilitades siin vaike- ja fallback-väärtused.
 */

function norm(s: string) {
  return s.trim().toLowerCase().replace(/[\u2011\u2010\u2212]/g, "-");
}

/** Kas töökuulutus vastab ühele kiibile (AND loogika kasutab mitut kiipi). */
export function chipMatchesJob(job: Job, chip: string): boolean {
  if (job.type === chip) return true;
  if (job.tags.includes(chip)) return true;
  if (job.requiredCerts.includes(chip)) return true;
  if (job.domains?.includes(chip)) return true;
  if (job.languages?.includes(chip)) return true;

  const c = norm(chip);
  const jl = norm(job.location);
  const parts = job.location
    .split(/[/,|]/)
    .map((p) => norm(p.trim()))
    .filter(Boolean);
  if (parts.some((p) => p === c)) return true;
  if (jl === c) return true;
  if (c === "hübriid") return jl.includes("hübriid");
  if (c === "kaugtoo") return jl.includes("kaugtoo");

  return false;
}

export const QUICK_CHIPS = [
  "Tallinn",
  "Tartu",
  "A-pädevus",
  "TypeScript",
  "Vahetused",
  "Täistööaeg",
  "IT",
  "Tervishoid",
] as const;

export const DEFAULT_QUICK_CHIPS = QUICK_CHIPS;
