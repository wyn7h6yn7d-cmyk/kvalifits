"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { PROFILE_GAP_HREF, type ProfileCompleteness } from "@/lib/seeker/profileCompleteness";

export function SeekerCompletenessPanel({
  completeness,
  linkGaps = true,
}: {
  completeness: ProfileCompleteness;
  linkGaps?: boolean;
}) {
  const t = useTranslations("seekerDashboard");
  const shown = completeness.missing.slice(0, 4);
  const width = Math.min(100, Math.max(0, completeness.percent));

  return (
    <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 sm:p-6">
      <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
        {t("profileReady", { percent: completeness.percent })}
      </h2>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#f8fafc]" aria-hidden>
        <div className="h-full rounded-full bg-white/45" style={{ width: `${width}%` }} />
      </div>
      {completeness.coreComplete && completeness.missing.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-muted">{t("profileComplete")}</p>
      ) : null}
      {shown.length ? (
        <ul className="mt-4 space-y-2">
          {shown.map((gap) => {
            const label = t(`gap.${gap}`);
            return (
              <li key={gap}>
                {linkGaps ? (
                  <Link
                    href={PROFILE_GAP_HREF[gap]}
                    className="text-sm leading-relaxed text-muted underline-offset-4 hover:text-foreground/85 hover:underline"
                  >
                    {label}
                  </Link>
                ) : (
                  <span className="text-sm leading-relaxed text-muted">{label}</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
