import { getTranslations } from "next-intl/server";

import type { MinorJobEligibilityStatus } from "@/lib/employmentRules";

type Props = {
  locale: string;
  status: MinorJobEligibilityStatus;
};

export async function SeekerMinorJobEligibilityBanner({ locale, status }: Props) {
  const t = await getTranslations({ locale, namespace: "jobs" });

  const copy =
    status === "suitable"
      ? t("minorEligibilitySuitable")
      : status === "needs_review"
        ? t("minorEligibilityNeedsReview")
        : t("minorEligibilityScheduleNotSuitable");

  const tone =
    status === "suitable"
      ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100/90"
      : status === "needs_review"
        ? "border-amber-400/20 bg-amber-400/[0.06] text-amber-100/90"
        : "border-rose-400/20 bg-rose-400/[0.06] text-rose-100/90";

  return (
    <div className={`rounded-3xl border px-4 py-3 text-sm leading-relaxed sm:px-5 sm:py-4 ${tone}`}>
      <div className="text-xs font-medium tracking-wide opacity-70">{t("minorEligibilityLabel")}</div>
      <div className="mt-1 font-medium">{copy}</div>
    </div>
  );
}
