export const TAXONOMY_KINDS = [
  "industry",
  "profession",
  "skill",
  "certificate",
  "language",
] as const;

export type TaxonomyKind = (typeof TAXONOMY_KINDS)[number];

export type TaxonomyTerm = {
  id: string;
  label_et: string;
  label_en: string;
  label_ru: string;
  sort_order: number;
  industry_id?: string | null;
  is_active?: boolean;
};

export type TaxonomyAlias = {
  kind: TaxonomyKind;
  term_id: string;
  alias: string;
  alias_norm: string;
};

export type TaxonomyCatalog = {
  industries: TaxonomyTerm[];
  professions: TaxonomyTerm[];
  skills: TaxonomyTerm[];
  certificates: TaxonomyTerm[];
  languages: TaxonomyTerm[];
  professionSkillIds: Record<string, string[]>;
  aliases: TaxonomyAlias[];
};

export const EMPTY_TAXONOMY_CATALOG: TaxonomyCatalog = {
  industries: [],
  professions: [],
  skills: [],
  certificates: [],
  languages: [],
  professionSkillIds: {},
  aliases: [],
};
