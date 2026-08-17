import type { SupabaseClient } from "@supabase/supabase-js";

import { EMPTY_TAXONOMY_CATALOG, type TaxonomyAlias, type TaxonomyCatalog, type TaxonomyKind, type TaxonomyTerm } from "@/lib/taxonomy/types";

function asTerms(raw: unknown): TaxonomyTerm[] {
  if (!Array.isArray(raw)) return [];
  const out: TaxonomyTerm[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const id = (o.id ?? "").toString().trim();
    if (!id) continue;
    if (o.is_active === false) continue;
    out.push({
      id,
      label_et: (o.label_et ?? "").toString(),
      label_en: (o.label_en ?? "").toString(),
      label_ru: (o.label_ru ?? "").toString(),
      sort_order: Number(o.sort_order) || 100,
      industry_id: o.industry_id == null ? null : String(o.industry_id),
      is_active: true,
    });
  }
  return out.sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
}

function asAliases(raw: unknown): TaxonomyAlias[] {
  if (!Array.isArray(raw)) return [];
  const kinds = new Set(["industry", "profession", "skill", "certificate", "language"]);
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const o = row as Record<string, unknown>;
      const kind = (o.kind ?? "").toString() as TaxonomyKind;
      const term_id = (o.term_id ?? "").toString().trim();
      const alias = (o.alias ?? "").toString().trim();
      if (!kinds.has(kind) || !term_id || !alias) return null;
      return {
        kind,
        term_id,
        alias,
        alias_norm: (o.alias_norm ?? "").toString().trim(),
      } satisfies TaxonomyAlias;
    })
    .filter((a): a is TaxonomyAlias => Boolean(a));
}

export async function loadTaxonomyCatalog(supabase: SupabaseClient): Promise<TaxonomyCatalog> {
  const [industries, professions, skills, certificates, languages, links, aliases] = await Promise.all([
    supabase.from("taxonomy_industries").select("id,label_et,label_en,label_ru,sort_order,is_active").eq("is_active", true),
    supabase
      .from("taxonomy_professions")
      .select("id,industry_id,label_et,label_en,label_ru,sort_order,is_active")
      .eq("is_active", true),
    supabase.from("taxonomy_skills").select("id,label_et,label_en,label_ru,sort_order,is_active").eq("is_active", true),
    supabase.from("taxonomy_certificates").select("id,label_et,label_en,label_ru,sort_order,is_active").eq("is_active", true),
    supabase.from("taxonomy_languages").select("id,label_et,label_en,label_ru,sort_order,is_active").eq("is_active", true),
    supabase.from("taxonomy_profession_skills").select("profession_id,skill_id"),
    supabase.from("taxonomy_aliases").select("kind,term_id,alias,alias_norm"),
  ]);

  if (
    industries.error ||
    professions.error ||
    skills.error ||
    certificates.error ||
    languages.error
  ) {
    return EMPTY_TAXONOMY_CATALOG;
  }

  const professionSkillIds: Record<string, string[]> = {};
  for (const row of links.data ?? []) {
    const professionId = (row as { profession_id?: string }).profession_id?.trim();
    const skillId = (row as { skill_id?: string }).skill_id?.trim();
    if (!professionId || !skillId) continue;
    const list = professionSkillIds[professionId] ?? [];
    if (!list.includes(skillId)) list.push(skillId);
    professionSkillIds[professionId] = list;
  }

  return {
    industries: asTerms(industries.data),
    professions: asTerms(professions.data),
    skills: asTerms(skills.data),
    certificates: asTerms(certificates.data),
    languages: asTerms(languages.data),
    professionSkillIds,
    aliases: asAliases(aliases.error ? [] : aliases.data),
  };
}

export function catalogIsEmpty(catalog: TaxonomyCatalog): boolean {
  return (
    catalog.industries.length === 0 &&
    catalog.professions.length === 0 &&
    catalog.skills.length === 0 &&
    catalog.certificates.length === 0 &&
    catalog.languages.length === 0
  );
}
