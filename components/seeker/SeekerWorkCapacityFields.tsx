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
    <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 sm:p-6 space-y-4">
      <div>
        <div className="text-sm font-medium text-foreground/80">{t("workCapacityTitle")}</div>
        <div className="mt-1 text-sm leading-relaxed text-muted">{t("workCapacityHint")}</div>
        <div className="mt-2 text-xs leading-relaxed text-muted-2">{t("workCapacityPrivacy")}</div>
        <div className="mt-2 text-xs leading-relaxed text-muted-2">{t("workCapacityNoMedical")}</div>
      </div>

      <fieldset className="space-y-2">
        <legend className="sr-only">{t("workCapacityTitle")}</legend>
        {WORK_CAPACITY_STATUS_VALUES.map((status) => (
          <label
            key={status}
            className="flex cursor-pointer select-none items-start gap-3 rounded-2xl border border-border bg-white px-4 py-3"
          >
            <input
              type="radio"
              name="work-capacity-status"
              checked={value === status}
              onChange={() => onChange(status)}
              className="mt-1 h-4 w-4 border-border-strong bg-[#f8fafc]"
            />
            <span className="text-sm font-medium text-foreground/80">{t(`workCapacityOption.${status}`)}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
