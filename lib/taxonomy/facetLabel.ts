import type { JobFilterFacet } from "@/lib/jobs/jobSearchFacets";
import { findTerm, taxonomyLabel } from "@/lib/taxonomy/labels";
import { resolveTaxonomyId } from "@/lib/taxonomy/resolve";
import type { TaxonomyCatalog, TaxonomyKind } from "@/lib/taxonomy/types";

const FACET_KIND: Partial<Record<JobFilterFacet, TaxonomyKind>> = {
  domain: "industry",
  skill: "skill",
  cert: "certificate",
  language: "language",
};

export function taxonomyFacetLabel(
  catalog: TaxonomyCatalog,
  facet: JobFilterFacet,
  value: string,
  locale: string,
  languageName?: (id: string) => string,
): string {
  const kind = FACET_KIND[facet];
  if (!kind) return value;
  const id = resolveTaxonomyId(catalog, kind, value) ?? value;
  const term = findTerm(catalog, kind, id);
  if (term) return taxonomyLabel(term, locale);
  if (kind === "language" && languageName) {
    try {
      return languageName(id);
    } catch {
      return value;
    }
  }
  return value;
}
