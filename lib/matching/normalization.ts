import { SYNONYM_FAMILIES } from "@/lib/matching/synonyms";

/**
 * Deterministic normalization + synonym-canonicalization utilities.
 *
 * This is intentionally simple and production-safe:
 * - No black-box semantics
 * - No large ontology
 * - Explicit, maintainable synonym families
 */

const STOP = new Set([
  "and",
  "or",
  "the",
  "for",
  "a",
  "an",
  "of",
  "in",
  "to",
  "with",
  "on",
  "at",
  "as",
  "by",
  // RU (short function words)
  "и",
  "в",
  "на",
  "с",
  "по",
  "для",
  "к",
  "от",
  "из",
  "как",
  "а",
  "но",
  "не",
  "что",
  "это",
  "или",
]);

/**
 * Shared text collapse for matching: lowercase, strip Latin combining marks, keep all Unicode letters (incl. Cyrillic) + digits.
 */
export function normalizeMatchBlob(parts: Array<string | null | undefined>): string {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normBlob(parts: (string | null | undefined)[]) {
  return normalizeMatchBlob(parts);
}

function words(s: string) {
  return s
    .split(/\s+/g)
    .map((w) => w.trim())
    .filter((w) => w.length > 1);
}

const SYN_CANON: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const [canon, variants] of Object.entries(SYNONYM_FAMILIES)) {
    for (const v of variants) {
      const k = normBlob([v]);
      if (k) m.set(k, canon);
    }
  }
  return m;
})();

function stemToken(tok: string) {
  const t = tok.trim();
  if (t.length < 4) return t;
  // Conservative suffix stripping: helps plural/declension tolerance without over-stemming.
  const SUF = [
    "idega",
    "idele",
    "idelt",
    "idest",
    "idel",
    "id",
    "de",
    "te",
    "ga",
    "le",
    "lt",
    "st",
    "s",
    "d",
  ];
  for (const suf of SUF) {
    if (t.length > suf.length + 2 && t.endsWith(suf)) return t.slice(0, -suf.length);
  }
  return t;
}

export type MatchStrength = "exact" | "related" | "partial" | "none";

export function tokenizeToCanonSet(textParts: Array<string | null | undefined>) {
  const blob = normBlob(textParts);
  const base = words(blob).filter((w) => w.length > 2 && !STOP.has(w));
  const out = new Set<string>();
  for (const raw of base) {
    const stem = stemToken(raw);
    const canon = SYN_CANON.get(stem) ?? SYN_CANON.get(raw) ?? stem;
    if (canon.length > 1) out.add(canon);
  }
  return out;
}

export function overlapJaccard(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

export function jaccardToStrength(j: number): MatchStrength {
  if (j >= 0.66) return "exact";
  if (j >= 0.38) return "related";
  if (j >= 0.2) return "partial";
  return "none";
}

export function strengthToScore(s: MatchStrength): number {
  switch (s) {
    case "exact":
      return 1;
    case "related":
      return 0.6;
    case "partial":
      return 0.35;
    default:
      return 0;
  }
}

/**
 * Convenience for single-string comparisons.
 * Returns jaccard + strength classification (useful for explainability later).
 */
export function compareText(
  aParts: Array<string | null | undefined>,
  bParts: Array<string | null | undefined>
): { jaccard: number; strength: MatchStrength } {
  const a = tokenizeToCanonSet(aParts);
  const b = tokenizeToCanonSet(bParts);
  const j = overlapJaccard(a, b);
  return { jaccard: j, strength: jaccardToStrength(j) };
}

