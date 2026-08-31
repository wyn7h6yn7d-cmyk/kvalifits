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
      ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-800"
      : status === "needs_review"
        ? "border-amber-400/20 bg-amber-400/[0.06] text-amber-800"
        : "border-rose-400/20 bg-rose-400/[0.06] text-rose-800";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed sm:px-5 sm:py-4 ${tone}`}>
      <div className="text-[0.9375rem] font-medium leading-snug opacity-80">{t("minorEligibilityLabel")}</div>
      <div className="mt-1 text-base font-medium leading-snug">{copy}</div>
    </div>
  );
}
