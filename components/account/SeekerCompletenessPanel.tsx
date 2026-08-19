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
    <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
      <h2 className="text-[17px] font-semibold tracking-tight text-white/92">
        {t("profileReady", { percent: completeness.percent })}
      </h2>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.08]" aria-hidden>
        <div className="h-full rounded-full bg-white/45" style={{ width: `${width}%` }} />
      </div>
      {completeness.coreComplete && completeness.missing.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-white/60">{t("profileComplete")}</p>
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
                    className="text-sm leading-relaxed text-white/62 underline-offset-4 hover:text-white/85 hover:underline"
                  >
                    {label}
                  </Link>
                ) : (
                  <span className="text-sm leading-relaxed text-white/62">{label}</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
