import type { Job } from "@/components/jobs/mock-data";

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

/** Mitu populaarseimat profiilimärki kuvatakse küljeribal (ülejäänud võib laadida „Näita rohkem“). */
export const PROFILE_POPULAR_DISPLAY_LIMIT = 10;

/**
 * Kõige sagedamini profiilidesse lisatavad oskused / load / signaalid (simulatsioon).
 * Kui kasutaja lisab profiilile midagi, mida teised sageli lisavad, ilmub see nimekiri API-st;
 * seni on see staatiline, korrastatud populaarsuse järjekorras.
 */
export const POPULAR_PROFILE_SIGNALS = [
  "TypeScript",
  "React",
  "Python",
  "SQL",
  "AWS",
  "Excel (täpne)",
  "B-kategooria juhiluba",
  "Docker",
  "Linux",
  "Projektijuhtimine",
  "Keele tase B2+",
  "SAP kasutaja",
  "AutoCAD",
  "First aid / esmaabi",
] as const;

export const popularProfileChips = POPULAR_PROFILE_SIGNALS.slice(0, PROFILE_POPULAR_DISPLAY_LIMIT);

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

export type FacetGroup = {
  id: string;
  values: readonly string[];
};

export const FACET_GROUPS: FacetGroup[] = [
  {
    id: "sertifikaat",
    values: [
      "A-pädevus",
      "B-pädevus",
      "Kutsetunnistus",
      "Kutse tase 4",
      "Tõstukiluba",
      "Tööohutus",
      "Töötamine kõrguses",
    ],
  },
  {
    id: "valdkond",
    values: ["IT", "Tervishoid", "Tootmine", "Ehitus", "Logistika", "Teenindus", "Ilu", "Energeetika"],
  },
  {
    id: "keel",
    values: ["Eesti keel", "Inglise keel", "Vene keel", "Soome keel"],
  },
  {
    id: "asukoht",
    values: ["Tallinn", "Tartu", "Harjumaa", "Pärnu", "Ida-Virumaa", "Kaugtoo", "Hübriid"],
  },
  {
    id: "tyyp",
    values: ["Täistööaeg", "Osaline", "Vahetused", "Projekt"],
  },
];
