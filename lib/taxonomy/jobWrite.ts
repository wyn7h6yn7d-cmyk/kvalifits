import { joinLegacyText, mergeLegacyText } from "@/lib/taxonomy/resolve";
import type { TaxonomyCatalog } from "@/lib/taxonomy/types";
import { omitKeys } from "@/lib/utils";

export type JobTaxonomyFormValue = {
  industryId: string;
  professionId: string;
  skillIds: string[];
  skillLeftover: string[];
  certificateIds: string[];
  certificateLeftover: string[];
  languageIds: string[];
};

export function jobTaxonomyWriteColumns(
  catalog: TaxonomyCatalog,
  form: JobTaxonomyFormValue,
): {
  industry_id: string | null;
  profession_id: string | null;
  skill_ids: string[];
  certificate_ids: string[];
  language_ids: string[];
  required_skills: string[];
  certificate_requirements: string | null;
  languages: string[];
} {
  const required_skills = mergeLegacyText(catalog, "skill", form.skillIds, form.skillLeftover, "et");
  const certs = mergeLegacyText(catalog, "certificate", form.certificateIds, form.certificateLeftover, "et");
  const languages = mergeLegacyText(catalog, "language", form.languageIds, [], "et");
  return {
    industry_id: form.industryId || null,
    profession_id: form.professionId || null,
    skill_ids: form.skillIds,
    certificate_ids: form.certificateIds,
    language_ids: form.languageIds,
    required_skills,
    certificate_requirements: joinLegacyText(certs) || null,
    languages,
  };
}

export function stripTaxonomyWriteColumns<T extends Record<string, unknown>>(payload: T): Omit<
  T,
  "industry_id" | "profession_id" | "skill_ids" | "certificate_ids" | "language_ids"
> {
  return omitKeys(payload, [
    "industry_id",
    "profession_id",
    "skill_ids",
    "certificate_ids",
    "language_ids",
  ]);
}
