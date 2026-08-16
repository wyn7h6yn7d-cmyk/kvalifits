/** Job post salary (employer-facing). Separate from seeker apply salary answers. */

export const JOB_SALARY_MODE_VALUES = ["fixed", "range"] as const;
export type JobSalaryMode = (typeof JOB_SALARY_MODE_VALUES)[number];

export const JOB_SALARY_TAX_VALUES = ["bruto", "neto"] as const;
export type JobSalaryTax = (typeof JOB_SALARY_TAX_VALUES)[number];

export const JOB_SALARY_PERIOD_VALUES = ["month", "hour"] as const;
export type JobSalaryPeriod = (typeof JOB_SALARY_PERIOD_VALUES)[number];

export type JobSalaryInput = {
  mode: JobSalaryMode | "";
  min: string;
  max: string;
  tax: JobSalaryTax;
  period: JobSalaryPeriod;
  currency?: string;
};

export type JobSalaryParsed = {
  mode: JobSalaryMode;
  salary_min: number;
  salary_max: number;
  salary_tax: JobSalaryTax;
  salary_period: JobSalaryPeriod;
  salary_currency: string;
};

export function isJobSalaryMode(v: unknown): v is JobSalaryMode {
  return typeof v === "string" && (JOB_SALARY_MODE_VALUES as readonly string[]).includes(v);
}

export function isJobSalaryTax(v: unknown): v is JobSalaryTax {
  return typeof v === "string" && (JOB_SALARY_TAX_VALUES as readonly string[]).includes(v);
}

export function isJobSalaryPeriod(v: unknown): v is JobSalaryPeriod {
  return typeof v === "string" && (JOB_SALARY_PERIOD_VALUES as readonly string[]).includes(v);
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s+/g, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Validates mandatory salary for publishing a job.
 * Returns a stable error code for i18n mapping.
 */
export function parseJobSalaryForPublish(input: JobSalaryInput):
  | { ok: true; value: JobSalaryParsed }
  | { ok: false; error: string } {
  if (!isJobSalaryMode(input.mode)) return { ok: false, error: "errSalaryModeRequired" };
  if (!isJobSalaryTax(input.tax)) return { ok: false, error: "errSalaryTaxRequired" };
  if (!isJobSalaryPeriod(input.period)) return { ok: false, error: "errSalaryPeriodRequired" };

  const currency = ((input.currency ?? "EUR").toString().trim() || "EUR").toUpperCase();

  if (input.mode === "fixed") {
    const amount = parseAmount(input.min) ?? parseAmount(input.max);
    if (amount === null) return { ok: false, error: "errSalaryAmountRequired" };
    return {
      ok: true,
      value: {
        mode: "fixed",
        salary_min: amount,
        salary_max: amount,
        salary_tax: input.tax,
        salary_period: input.period,
        salary_currency: currency,
      },
    };
  }

  const min = parseAmount(input.min);
  const max = parseAmount(input.max);
  if (min === null || max === null) return { ok: false, error: "errSalaryRangeRequired" };
  if (min > max) return { ok: false, error: "errSalaryRangeOrder" };

  return {
    ok: true,
    value: {
      mode: "range",
      salary_min: min,
      salary_max: max,
      salary_tax: input.tax,
      salary_period: input.period,
      salary_currency: currency,
    },
  };
}

/** Display like: "2300–2700 € bruto / kuu" */
export function formatJobSalaryDisplay(args: {
  min: number | null;
  max: number | null;
  currency?: string | null;
  tax?: string | null;
  period?: string | null;
  locale: string;
  taxLabel: string;
  periodLabel: string;
}): string | undefined {
  const { min, max } = args;
  if (min == null && max == null) return undefined;

  const tag = args.locale === "en" ? "en-GB" : args.locale === "ru" ? "ru-RU" : "et-EE";
  const fmt = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 });
  const cur = (args.currency || "EUR").toString().toUpperCase();
  const sym = cur === "EUR" ? "€" : cur;
  const nb = "\u00a0";

  let amount: string;
  if (min != null && max != null && min === max) {
    amount = `${fmt.format(min)}${nb}${sym}`;
  } else if (min != null && max != null) {
    amount = `${fmt.format(min)}${nb}–${nb}${fmt.format(max)}${nb}${sym}`;
  } else if (min != null) {
    amount = `${fmt.format(min)}${nb}${sym}`;
  } else {
    amount = `${fmt.format(max!)}${nb}${sym}`;
  }

  const tax = (args.taxLabel || "").trim();
  const period = (args.periodLabel || "").trim();
  if (tax && period) return `${amount} ${tax} / ${period}`;
  if (tax) return `${amount} ${tax}`;
  return amount;
}
