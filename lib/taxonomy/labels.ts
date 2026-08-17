import type { TaxonomyKind, TaxonomyTerm } from "@/lib/taxonomy/types";

export function taxonomyNorm(raw: string | null | undefined): string {
  return (raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\u2011\u2010\u2212]/g, "-")
    .replace(/\s+/g, " ");
}

export function taxonomyLabel(term: TaxonomyTerm | null | undefined, locale: string): string {
  if (!term) return "";
  if (locale === "en") return term.label_en || term.label_et;
  if (locale === "ru") return term.label_ru || term.label_et;
  return term.label_et;
}

export function termsForKind(
  catalog: {
    industries: TaxonomyTerm[];
    professions: TaxonomyTerm[];
    skills: TaxonomyTerm[];
    certificates: TaxonomyTerm[];
    languages: TaxonomyTerm[];
  },
  kind: TaxonomyKind,
): TaxonomyTerm[] {
  switch (kind) {
    case "industry":
      return catalog.industries;
    case "profession":
      return catalog.professions;
    case "skill":
      return catalog.skills;
    case "certificate":
      return catalog.certificates;
    case "language":
      return catalog.languages;
  }
}

export function findTerm(
  catalog: {
    industries: TaxonomyTerm[];
    professions: TaxonomyTerm[];
    skills: TaxonomyTerm[];
    certificates: TaxonomyTerm[];
    languages: TaxonomyTerm[];
  },
  kind: TaxonomyKind,
  id: string | null | undefined,
): TaxonomyTerm | null {
  if (!id) return null;
  return termsForKind(catalog, kind).find((t) => t.id === id) ?? null;
}
