"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import {
  APPLICATION_PIPELINE_ACTIVE,
  APPLICATION_PIPELINE_TERMINAL,
  normalizeApplicationStatus,
  type ApplicationPipelineStatus,
} from "@/lib/employer/applicationPipeline";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn, errorMessageFromUnknown } from "@/lib/utils";

type Props = {
  applicationId: string;
  status: string | null | undefined;
  onUpdated?: (next: ApplicationPipelineStatus) => void;
  compact?: boolean;
  className?: string;
};

function tone(status: ApplicationPipelineStatus) {
  switch (status) {
    case "new":
      return "border-sky-400/25 bg-sky-500/10 text-sky-100/90";
    case "reviewing":
      return "border-violet-400/25 bg-violet-500/10 text-violet-100/90";
    case "interview":
    case "interview_2":
      return "border-amber-400/25 bg-amber-500/10 text-amber-100/90";
    case "offer":
      return "border-emerald-400/25 bg-emerald-500/10 text-emerald-100/90";
    case "hired":
      return "border-emerald-400/35 bg-emerald-500/15 text-emerald-50";
    case "rejected":
      return "border-white/[0.12] bg-white/[0.04] text-white/55";
    case "withdrawn":
      return "border-white/[0.10] bg-white/[0.03] text-white/45";
    default:
      return "border-white/[0.10] bg-white/[0.04] text-white/70";
  }
}

export function EmployerApplicationStatusSelect({
  applicationId,
  status,
  onUpdated,
  compact,
  className,
}: Props) {
  const t = useTranslations("jobs");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [value, setValue] = useState<ApplicationPipelineStatus>(() => normalizeApplicationStatus(status));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: ApplicationPipelineStatus) {
    if (next === value) return;
    const prev = value;
    setValue(next);
    setSaving(true);
    setError(null);
    try {
      const { error: updErr } = await supabase
        .from("job_applications")
        .update({ status: next, updated_at: new Date().toISOString() })
        .eq("id", applicationId);
      if (updErr) throw updErr;
      onUpdated?.(next);
    } catch (e) {
      setValue(prev);
      const raw = errorMessageFromUnknown(e, t("unknownError"));
      const lower = raw.toLowerCase();
      setError(
        lower.includes("policy") || lower.includes("row-level") || lower.includes("permission")
          ? `${raw}\n\n${t("applicationPipelineFixHint")}`
          : raw
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn("min-w-0", className)} onClick={(e) => e.preventDefault()}>
      <label className="sr-only" htmlFor={`app-status-${applicationId}`}>
        {t("applicationPipelineStatusLabel")}
      </label>
      <select
        id={`app-status-${applicationId}`}
        value={value}
        disabled={saving}
        onChange={(e) => onChange(e.target.value as ApplicationPipelineStatus)}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full rounded-xl border px-2.5 font-medium outline-none transition-colors",
          "focus:border-white/[0.20]",
          compact ? "h-9 text-[11px]" : "h-10 text-xs",
          tone(value),
          saving && "opacity-70"
        )}
      >
        <optgroup label={t("applicationPipelinePathLabel")}>
          {APPLICATION_PIPELINE_ACTIVE.map((s) => (
            <option key={s} value={s} className="bg-zinc-900 text-white">
              {t(`applicationPipelineStatus.${s}`)}
            </option>
          ))}
        </optgroup>
        <optgroup label={t("applicationPipelineOutcomesLabel")}>
          {APPLICATION_PIPELINE_TERMINAL.map((s) => (
            <option key={s} value={s} className="bg-zinc-900 text-white">
              {t(`applicationPipelineStatus.${s}`)}
            </option>
          ))}
        </optgroup>
      </select>
      {error ? (
        <p className="mt-1.5 whitespace-pre-wrap text-[10px] leading-snug text-rose-200/85">{error}</p>
      ) : null}
    </div>
  );
}
