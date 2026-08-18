"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { Bookmark } from "lucide-react";
import { useTranslations } from "next-intl";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Props = {
  jobId: string;
  className?: string;
  initialSaved?: boolean;
  variant?: "icon" | "labeled";
  unsavedLabel?: string;
  savedLabel?: string;
  onSavedChange?: (saved: boolean) => void;
};

export function JobSaveButton({
  jobId,
  className,
  initialSaved = false,
  variant = "icon",
  unsavedLabel,
  savedLabel,
  onSavedChange,
}: Props) {
  const t = useTranslations("jobCard");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved, jobId]);

  const label = saved ? (savedLabel ?? t("savedStateSaved")) : (unsavedLabel ?? t("savedStateUnsaved"));

  async function onClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const next = !saved;
    setSaved(next);
    setBusy(true);
    try {
      if (next) {
        const { error } = await supabase.from("saved_jobs").insert({
          seeker_user_id: user.id,
          job_post_id: jobId,
        });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("saved_jobs")
          .delete()
          .eq("seeker_user_id", user.id)
          .eq("job_post_id", jobId);
        if (error) throw error;
      }
      onSavedChange?.(next);
    } catch {
      setSaved(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.03] text-white/55 transition-colors hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white/85 disabled:opacity-60",
        variant === "labeled"
          ? "h-11 min-w-0 gap-2 whitespace-normal px-3.5 text-center text-[13px] font-medium lg:h-9 lg:whitespace-nowrap"
          : "h-11 w-11 lg:h-9 lg:w-9",
        saved && "border-white/[0.16] bg-white/[0.07] text-white/90",
        className,
      )}
      aria-pressed={saved}
      aria-label={label}
      title={label}
    >
      <Bookmark className={cn("h-4 w-4", saved && "fill-current")} aria-hidden />
      {variant === "labeled" ? <span>{label}</span> : null}
    </button>
  );
}
