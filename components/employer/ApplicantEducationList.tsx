"use client";

import { useTranslations } from "next-intl";

import { educationPeriodLabel, parseEducationRows } from "@/lib/seeker/education";

export function ApplicantEducationList({
  raw,
  variant = "page",
}: {
  raw: unknown;
  variant?: "page" | "drawer";
}) {
  const t = useTranslations("education");
  const tJobs = useTranslations("jobs");
  const rows = parseEducationRows(raw);
  if (!rows.length) return null;

  const headingClass =
    variant === "drawer"
      ? "text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40"
      : "text-xs font-medium tracking-wide text-white/55";

  return (
    <section className={variant === "drawer" ? undefined : "mt-5"}>
      <h3 className={headingClass}>{tJobs("applicantDetailEducation")}</h3>
      <ul className="mt-2 space-y-2 text-sm text-white/70">
        {rows.map((row, i) => (
          <li key={`${i}-${row.institution.slice(0, 24)}-${row.start_year}`}>
            <div className="font-medium text-white/85">{row.institution}</div>
            <div className="text-[13px] text-white/60">
              {t(`level.${row.degree_or_level}`)}
              {row.field_of_study ? ` · ${row.field_of_study}` : ""}
              {` · ${educationPeriodLabel(row)}`}
              {row.currently_studying ? ` · ${t("currentlyStudying")}` : ""}
            </div>
            {row.description ? <p className="mt-0.5 text-[13px] leading-relaxed text-white/50">{row.description}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
