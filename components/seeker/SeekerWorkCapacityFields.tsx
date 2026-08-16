"use client";

import { useTranslations } from "next-intl";

import {
  WORK_CAPACITY_STATUS_VALUES,
  type WorkCapacityStatus,
} from "@/lib/seeker/workCapacity";

type Props = {
  value: WorkCapacityStatus;
  onChange: (next: WorkCapacityStatus) => void;
};

export function SeekerWorkCapacityFields({ value, onChange }: Props) {
  const t = useTranslations("onboarding");

  return (
    <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6 space-y-4">
      <div>
        <div className="text-sm font-medium text-white/85">{t("workCapacityTitle")}</div>
        <div className="mt-1 text-sm leading-relaxed text-white/60">{t("workCapacityHint")}</div>
        <div className="mt-2 text-xs leading-relaxed text-white/45">{t("workCapacityPrivacy")}</div>
        <div className="mt-2 text-xs leading-relaxed text-white/45">{t("workCapacityNoMedical")}</div>
      </div>

      <fieldset className="space-y-2">
        <legend className="sr-only">{t("workCapacityTitle")}</legend>
        {WORK_CAPACITY_STATUS_VALUES.map((status) => (
          <label
            key={status}
            className="flex cursor-pointer select-none items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
          >
            <input
              type="radio"
              name="work-capacity-status"
              checked={value === status}
              onChange={() => onChange(status)}
              className="mt-1 h-4 w-4 border-white/[0.20] bg-white/[0.03]"
            />
            <span className="text-sm font-medium text-white/80">{t(`workCapacityOption.${status}`)}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
