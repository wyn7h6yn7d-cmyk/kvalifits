"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import {
  EXPERIENCE_BACKGROUND_KEYS,
  type ExperienceBackgroundFormValue,
  type ExperienceBackgroundKey,
} from "@/lib/seeker/experienceBackground";

type Props = {
  value: ExperienceBackgroundFormValue;
  onChange: (next: ExperienceBackgroundFormValue) => void;
};

export function SeekerExperienceBackgroundFields({ value, onChange }: Props) {
  const t = useTranslations("onboarding");

  function patch(partial: Partial<ExperienceBackgroundFormValue>) {
    onChange({ ...value, ...partial });
  }

  function setFlag(key: ExperienceBackgroundKey, checked: boolean) {
    patch({ [key]: checked } as Partial<ExperienceBackgroundFormValue>);
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6 sm:col-span-2">
      <div>
        <div className="text-sm font-medium text-white/85">{t("experienceBackgroundTitle")}</div>
        <div className="mt-1 text-sm leading-relaxed text-white/60">{t("experienceBackgroundHint")}</div>
        <div className="mt-2 text-xs leading-relaxed text-white/45">{t("experienceBackgroundZeroOk")}</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {EXPERIENCE_BACKGROUND_KEYS.map((key) => (
          <label key={key} className="flex cursor-pointer select-none items-start gap-3">
            <input
              type="checkbox"
              checked={Boolean(value[key])}
              onChange={(e) => setFlag(key, e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/[0.20] bg-white/[0.03]"
            />
            <span className="text-sm font-medium text-white/80">{t(`experienceBackground.${key}`)}</span>
          </label>
        ))}
      </div>

      <div className="space-y-2 max-w-xs">
        <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="exp-duration-years">
          {t("experienceDurationYears")}
        </label>
        <Input
          id="exp-duration-years"
          value={value.duration_years}
          onChange={(e) => patch({ duration_years: e.target.value })}
          inputMode="decimal"
          placeholder={t("experienceDurationYearsHint")}
        />
        <div className="text-xs text-white/45">{t("experienceDurationYearsHelp")}</div>
      </div>
    </div>
  );
}
