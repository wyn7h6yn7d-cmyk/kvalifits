/**
 * Structured job requirements with mandatory / recommended priority.
 * Matching reads `job_requirements` (with fallback to `requirement_lines`).
 */

export const JOB_REQUIREMENT_PRIORITY_VALUES = ["mandatory", "recommended"] as const;
export type JobRequirementPriority = (typeof JOB_REQUIREMENT_PRIORITY_VALUES)[number];

export type JobRequirementItem = {
  text: string;
  priority: JobRequirementPriority;
};

export function isJobRequirementPriority(v: unknown): v is JobRequirementPriority {
  return typeof v === "string" && (JOB_REQUIREMENT_PRIORITY_VALUES as readonly string[]).includes(v);
}

/** Normalize DB / form JSON into a clean list. */
export function parseJobRequirements(raw: unknown): JobRequirementItem[] {
  if (!Array.isArray(raw)) return [];
  const out: JobRequirementItem[] = [];
  for (const row of raw) {
    if (typeof row === "string") {
      const text = row.trim();
      if (text) out.push({ text, priority: "mandatory" });
      continue;
    }
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const text = String(o.text ?? o.line ?? o.label ?? "").trim();
    if (!text) continue;
    const priority = isJobRequirementPriority(o.priority) ? o.priority : "mandatory";
    out.push({ text, priority });
  }
  return out;
}

/** Legacy `requirement_lines` / free text → structured list (default mandatory). */
export function jobRequirementsFromLines(lines: string[], priority: JobRequirementPriority = "mandatory"): JobRequirementItem[] {
  return lines
    .map((s) => s.trim())
    .filter(Boolean)
    .map((text) => ({ text, priority }));
}

export function jobRequirementTexts(items: JobRequirementItem[]): string[] {
  return items.map((x) => x.text.trim()).filter(Boolean);
}

/** Keep matching columns in sync until the algorithm reads `job_requirements`. */
export function syncRequirementLinesFromStructured(items: JobRequirementItem[]): {
  requirement_lines: string[];
  requirements: string;
  job_requirements: JobRequirementItem[];
} {
  const cleaned = items
    .map((x) => ({
      text: x.text.trim(),
      priority: isJobRequirementPriority(x.priority) ? x.priority : ("mandatory" as const),
    }))
    .filter((x) => x.text.length > 0);
  const lines = cleaned.map((x) => x.text);
  return {
    job_requirements: cleaned,
    requirement_lines: lines,
    requirements: lines.join("\n"),
  };
}

export function resolveJobRequirements(args: {
  job_requirements?: unknown;
  requirement_lines?: string[] | null;
  requirements?: string | null;
}): JobRequirementItem[] {
  const structured = parseJobRequirements(args.job_requirements);
  if (structured.length) return structured;
  const lines = Array.isArray(args.requirement_lines)
    ? args.requirement_lines.map((x) => String(x).trim()).filter(Boolean)
    : [];
  if (lines.length) return jobRequirementsFromLines(lines);
  const fromText = (args.requirements ?? "")
    .toString()
    .split(/\r?\n/g)
    .map((s) => s.trim())
    .filter(Boolean);
  return jobRequirementsFromLines(fromText);
}
