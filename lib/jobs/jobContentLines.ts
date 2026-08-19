import { omitKeys } from "@/lib/utils";

export const JOB_CONTENT_LINE_MIN = 2;
export const JOB_CONTENT_LINE_MAX = 200;
export const JOB_CONTENT_LINES_MAX = 30;

export type JobContentLinesError = "too_many" | "line_too_short" | "line_too_long";

export function isJobContentLinesColumnError(message: string | undefined): boolean {
  return /duty_lines|benefit_lines/i.test(message ?? "") && /column|schema cache|does not exist/i.test(message ?? "");
}

export function stripJobContentLineColumns<T extends Record<string, unknown>>(
  payload: T,
): Omit<T, "duty_lines" | "benefit_lines"> {
  return omitKeys(payload, ["duty_lines", "benefit_lines"]);
}

function lineFromUnknown(raw: unknown): string | null {
  if (typeof raw === "string") {
    const text = raw.trim();
    return text ? text : null;
  }
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const text = String(o.text ?? o.line ?? o.label ?? "").trim();
  return text ? text : null;
}

/** Normalize DB / form values into trimmed non-empty lines (capped). */
export function parseJobContentLines(raw: unknown): string[] {
  const source =
    typeof raw === "string"
      ? raw.split(/\r?\n/g)
      : Array.isArray(raw)
        ? raw
        : [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const row of source) {
    const text = lineFromUnknown(row);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= JOB_CONTENT_LINES_MAX) break;
  }
  return out;
}

export function sanitizeJobContentLines(raw: unknown): string[] {
  return parseJobContentLines(raw).map((line) => line.slice(0, JOB_CONTENT_LINE_MAX));
}

export function validateJobContentLines(
  raw: unknown,
): { ok: true; value: string[] } | { ok: false; error: JobContentLinesError } {
  const source = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(/\r?\n/g)
      : [];
  const pending: string[] = [];
  for (const row of source) {
    const text = lineFromUnknown(row);
    if (!text) continue;
    if (text.length < JOB_CONTENT_LINE_MIN) return { ok: false, error: "line_too_short" };
    if (text.length > JOB_CONTENT_LINE_MAX) return { ok: false, error: "line_too_long" };
    pending.push(text);
  }
  if (pending.length > JOB_CONTENT_LINES_MAX) return { ok: false, error: "too_many" };
  return { ok: true, value: parseJobContentLines(pending) };
}

export function jobContentLinesI18nError(
  error: JobContentLinesError,
): "errJobLinesTooMany" | "errJobLineTooShort" | "errJobLineTooLong" {
  if (error === "too_many") return "errJobLinesTooMany";
  if (error === "line_too_short") return "errJobLineTooShort";
  return "errJobLineTooLong";
}
