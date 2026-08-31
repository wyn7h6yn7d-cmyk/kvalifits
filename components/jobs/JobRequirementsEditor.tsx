"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  JOB_REQUIREMENT_PRIORITY_VALUES,
  type JobRequirementItem,
  type JobRequirementPriority,
} from "@/lib/jobs/jobRequirements";
import { JobRequirementPriorityBadge } from "@/components/jobs/JobRequirementPriorityBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  value: JobRequirementItem[];
  onChange: (next: JobRequirementItem[]) => void;
  disabled?: boolean;
};

export function JobRequirementsEditor({ value, onChange, disabled }: Props) {
  const t = useTranslations("jobs");

  function updateAt(index: number, patch: Partial<JobRequirementItem>) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...value, { text: "", priority: "mandatory" }]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("jobRequirementLines")}</label>
          <p className="mt-1 text-xs leading-relaxed text-muted-2">{t("jobRequirementPriorityHelp")}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={addRow}
          className="shrink-0 gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {t("jobRequirementAdd")}
        </Button>
      </div>

      <ul className="list-none space-y-2.5 p-0">
        {value.map((row, index) => {
          const isMandatory = row.priority === "mandatory";
          return (
            <li
              key={`req-${index}`}
              className={cn(
                "rounded-2xl border p-3 transition-colors",
                isMandatory
                  ? "border-rose-400/25 bg-rose-500/[0.06]"
                  : "border-sky-400/20 bg-sky-500/[0.05]"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <JobRequirementPriorityBadge
                  priority={row.priority}
                  label={t(`jobRequirementPriority.${row.priority}`)}
                />
                <button
                  type="button"
                  disabled={disabled || value.length <= 1}
                  onClick={() => removeAt(index)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-2 transition-colors hover:border-[rgba(37,99,235,0.24)] hover:bg-[#f5f7fb] hover:text-foreground disabled:opacity-35"
                  aria-label={t("jobRequirementRemove")}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>

              <Input
                value={row.text}
                disabled={disabled}
                onChange={(e) => updateAt(index, { text: e.target.value })}
                placeholder={t("jobRequirementLinesHint")}
                className="mt-2.5"
                aria-label={t("jobRequirementItemLabel", { n: index + 1 })}
              />

              <div
                className="mt-2.5 grid grid-cols-2 gap-1.5"
                role="group"
                aria-label={t("jobRequirementPriorityLabel")}
              >
                {JOB_REQUIREMENT_PRIORITY_VALUES.map((p) => {
                  const active = row.priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      disabled={disabled}
                      onClick={() => updateAt(index, { priority: p as JobRequirementPriority })}
                      className={cn(
                        "min-h-11 rounded-xl border px-3 py-2 text-center text-xs font-semibold tracking-wide transition-colors",
                        p === "mandatory" &&
                          active &&
                          "border-rose-400/45 bg-rose-500/20 text-rose-50",
                        p === "mandatory" &&
                          !active &&
                          "border-border bg-white text-muted-2 hover:border-rose-400/25 hover:text-rose-700",
                        p === "recommended" &&
                          active &&
                          "border-sky-400/45 bg-sky-500/20 text-sky-50",
                        p === "recommended" &&
                          !active &&
                          "border-border bg-white text-muted-2 hover:border-sky-400/25 hover:text-sky-100/80"
                      )}
                    >
                      {t(`jobRequirementPriority.${p}`)}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      {!value.length ? (
        <button
          type="button"
          disabled={disabled}
          onClick={addRow}
          className="w-full rounded-2xl border border-dashed border-border bg-white/[0.01] px-4 py-6 text-center text-sm text-muted-2 transition-colors hover:border-[rgba(37,99,235,0.26)] hover:bg-[#f5f7fb] hover:text-foreground/70"
        >
          {t("jobRequirementAddFirst")}
        </button>
      ) : null}

      <div className="text-xs text-muted-2">
        {t("jobRequirementLinesHelp")} {t("jobFieldGuideRequirementsExtra")}
      </div>
    </div>
  );
}
