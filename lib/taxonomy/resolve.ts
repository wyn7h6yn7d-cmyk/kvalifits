import { findTerm, taxonomyLabel, taxonomyNorm, termsForKind } from "@/lib/taxonomy/labels";
import type { TaxonomyCatalog, TaxonomyKind } from "@/lib/taxonomy/types";

function aliasMap(catalog: TaxonomyCatalog, kind: TaxonomyKind): Map<string, string> {
  const map = new Map<string, string>();
  for (const term of termsForKind(catalog, kind)) {
    map.set(taxonomyNorm(term.id), term.id);
    map.set(taxonomyNorm(term.label_et), term.id);
    map.set(taxonomyNorm(term.label_en), term.id);
    map.set(taxonomyNorm(term.label_ru), term.id);
  }
  for (const a of catalog.aliases) {
    if (a.kind !== kind) continue;
    const key = a.alias_norm || taxonomyNorm(a.alias);
    if (key && !map.has(key)) map.set(key, a.term_id);
  }
  return map;
}

export function resolveTaxonomyId(
  catalog: TaxonomyCatalog,
  kind: TaxonomyKind,
  raw: string | null | undefined,
): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (findTerm(catalog, kind, value)) return value;
  return aliasMap(catalog, kind).get(taxonomyNorm(value)) ?? null;
}

export function partitionTaxonomyValues(
  catalog: TaxonomyCatalog,
  kind: TaxonomyKind,
  storedIds: string[] | null | undefined,
  texts: string[] | null | undefined,
): { ids: string[]; leftover: string[] } {
  const known = new Set(termsForKind(catalog, kind).map((t) => t.id));
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const raw of storedIds ?? []) {
    const id = raw.trim();
    if (!id || seen.has(id) || !known.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }

  const leftover: string[] = [];
  const leftoverSeen = new Set<string>();
  for (const raw of texts ?? []) {
    const text = raw.trim();
    if (!text) continue;
    const mapped = resolveTaxonomyId(catalog, kind, text);
    if (mapped && known.has(mapped)) {
      if (!seen.has(mapped)) {
        seen.add(mapped);
        ids.push(mapped);
      }
      continue;
    }
    const key = taxonomyNorm(text);
    if (leftoverSeen.has(key)) continue;
    leftoverSeen.add(key);
    leftover.push(text);
  }

  return { ids, leftover };
}

export function canonicalLabelsForIds(
  catalog: TaxonomyCatalog,
  kind: TaxonomyKind,
  ids: readonly string[],
  locale: string,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const term = findTerm(catalog, kind, id);
    const label = taxonomyLabel(term, locale) || id;
    const key = taxonomyNorm(label);
    if (!label || seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

/** Dual-write: canonical labels plus leftover free-text. Never drops unmapped values. */
export function mergeLegacyText(
  catalog: TaxonomyCatalog,
  kind: TaxonomyKind,
  ids: readonly string[],
  leftover: readonly string[],
  locale = "et",
): string[] {
  const labels = canonicalLabelsForIds(catalog, kind, ids, locale);
  const seen = new Set(labels.map(taxonomyNorm));
  const out = [...labels];
  for (const raw of leftover) {
    const text = raw.trim();
    if (!text) continue;
    const mapped = resolveTaxonomyId(catalog, kind, text);
    if (mapped && ids.includes(mapped)) continue;
    const key = taxonomyNorm(text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

export function splitCsv(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\n\r]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinLegacyText(values: readonly string[]): string {
  return values.filter(Boolean).join(", ");
}

export function suggestedSkillIds(catalog: TaxonomyCatalog, professionId: string | null | undefined): string[] {
  if (!professionId) return [];
  return catalog.professionSkillIds[professionId] ?? [];
}
