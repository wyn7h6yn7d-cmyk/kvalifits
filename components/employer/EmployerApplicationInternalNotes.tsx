"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn, errorMessageFromUnknown } from "@/lib/utils";

const MAX_LEN = 8000;

type Props = {
  applicationId: string;
  initialNote?: string | null;
  className?: string;
};

export function EmployerApplicationInternalNotes({ applicationId, initialNote, className }: Props) {
  const t = useTranslations("jobs");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [text, setText] = useState((initialNote ?? "").toString());
  const [savedText, setSavedText] = useState((initialNote ?? "").toString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const next = (initialNote ?? "").toString();
    setText(next);
    setSavedText(next);
  }, [initialNote, applicationId]);

  const dirty = text !== savedText;
  const overLimit = text.length > MAX_LEN;

  async function save() {
    if (overLimit) return;
    setSaving(true);
    setError(null);
    setSavedFlash(false);
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!user) throw new Error(t("notAuthed"));

      const now = new Date().toISOString();
      const payload = {
        application_id: applicationId,
        note_text: text.trim(),
        updated_by: user.id,
        updated_at: now,
      };

      const { error: upsertErr } = await supabase
        .from("job_application_internal_notes")
        .upsert(payload, { onConflict: "application_id" });
      if (upsertErr) throw upsertErr;

      setSavedText(text.trim());
      setText(text.trim());
      setSavedFlash(true);
    } catch (e) {
      const raw = errorMessageFromUnknown(e, t("unknownError"));
      const lower = raw.toLowerCase();
      setError(
        lower.includes("policy") ||
          lower.includes("row-level") ||
          lower.includes("permission") ||
          lower.includes("schema cache") ||
          lower.includes("does not exist")
          ? `${raw}\n\n${t("applicantInternalNotesFixHint")}`
          : raw
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className={cn(
        "rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6",
        className
      )}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
            {t("applicantInternalNotesTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/55">{t("applicantInternalNotesHint")}</p>
        </div>
        <span className="mt-2 inline-flex w-fit shrink-0 rounded-full border border-white/[0.10] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/45 sm:mt-0">
          {t("applicantInternalNotesPrivateBadge")}
        </span>
      </div>

      <label className="sr-only" htmlFor={`internal-note-${applicationId}`}>
        {t("applicantInternalNotesTitle")}
      </label>
      <textarea
        id={`internal-note-${applicationId}`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSavedFlash(false);
          setError(null);
        }}
        rows={4}
        maxLength={MAX_LEN + 200}
        placeholder={t("applicantInternalNotesPlaceholder")}
        className={cn(
          "mt-4 w-full resize-y rounded-2xl border border-white/[0.10] bg-black/20 px-3.5 py-3",
          "text-sm leading-relaxed text-white/85 placeholder:text-white/35",
          "outline-none transition-colors focus:border-white/[0.18]"
        )}
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[12px] text-white/40">
          {overLimit ? (
            <span className="text-rose-200/80">{t("applicantInternalNotesTooLong")}</span>
          ) : savedFlash && !dirty ? (
            <span className="text-emerald-100/70">{t("applicantInternalNotesSaved")}</span>
          ) : dirty ? (
            <span>{t("applicantInternalNotesUnsaved")}</span>
          ) : (
            <span>{t("applicantInternalNotesPrivacy")}</span>
          )}
        </div>
        <Button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || overLimit || saving}
          loading={saving}
          loadingText={t("saving")}
          className={cn(
            "h-9 rounded-xl px-4 text-[13px] font-medium",
            "border-white/[0.12] bg-white/[0.06] text-white/85 hover:bg-white/[0.10]",
            (!dirty || overLimit) && "opacity-50"
          )}
        >
          {t("applicantInternalNotesSave")}
        </Button>
      </div>

      {error ? (
        <p className="mt-3 whitespace-pre-wrap text-[12px] leading-snug text-rose-200/85">{error}</p>
      ) : null}
    </section>
  );
}
