"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";

export type JobWorkConditionsFormValue = {
  weeklyHours: string;
  dailyHours: string;
  shiftStart: string;
  shiftEnd: string;
  includesNightWork: boolean;
  isHazardousWork: boolean;
};

type Props = {
  value: JobWorkConditionsFormValue;
  onChange: (next: JobWorkConditionsFormValue) => void;
};

export function JobWorkConditionsFields({ value, onChange }: Props) {
  const t = useTranslations("jobs");

  function patch(partial: Partial<JobWorkConditionsFormValue>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 sm:p-6 space-y-4">
      <div>
        <div className="text-sm font-medium text-foreground/80">{t("workConditionsTitle")}</div>
        <div className="mt-1 text-sm leading-relaxed text-muted">{t("workConditionsHint")}</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground" htmlFor="job-weekly-hours">
            {t("weeklyHours")}
          </label>
          <Input
            id="job-weekly-hours"
            value={value.weeklyHours}
            onChange={(e) => patch({ weeklyHours: e.target.value })}
            inputMode="decimal"
            placeholder={t("weeklyHoursHint")}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground" htmlFor="job-daily-hours">
            {t("dailyHours")}
          </label>
          <Input
            id="job-daily-hours"
            value={value.dailyHours}
            onChange={(e) => patch({ dailyHours: e.target.value })}
            inputMode="decimal"
            placeholder={t("dailyHoursHint")}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground" htmlFor="job-shift-start">
            {t("shiftStart")}
          </label>
          <Input
            id="job-shift-start"
            type="time"
            value={value.shiftStart}
            onChange={(e) => patch({ shiftStart: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground" htmlFor="job-shift-end">
            {t("shiftEnd")}
          </label>
          <Input
            id="job-shift-end"
            type="time"
            value={value.shiftEnd}
            onChange={(e) => patch({ shiftEnd: e.target.value })}
          />
        </div>
      </div>

      <label className="flex cursor-pointer select-none items-start gap-3">
        <input
          type="checkbox"
          checked={value.includesNightWork}
          onChange={(e) => patch({ includesNightWork: e.target.checked })}
          className="mt-1 h-4 w-4 rounded border-border-strong bg-[#f8fafc]"
        />
        <span>
          <span className="block text-sm font-medium text-foreground/80">{t("includesNightWork")}</span>
          <span className="mt-0.5 block text-xs text-muted-2">{t("includesNightWorkHint")}</span>
        </span>
      </label>

      <label className="flex cursor-pointer select-none items-start gap-3">
        <input
          type="checkbox"
          checked={value.isHazardousWork}
          onChange={(e) => patch({ isHazardousWork: e.target.checked })}
          className="mt-1 h-4 w-4 rounded border-border-strong bg-[#f8fafc]"
        />
        <span>
          <span className="block text-sm font-medium text-foreground/80">{t("isHazardousWork")}</span>
          <span className="mt-0.5 block text-xs text-muted-2">{t("isHazardousWorkHint")}</span>
        </span>
      </label>
    </div>
  );
}

export function parseOptionalHours(v: string): number | null {
  const trimmed = v.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function timeOrNull(v: string): string | null {
  const t = v.trim();
  return t ? t : null;
}
