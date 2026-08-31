"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { Bookmark } from "lucide-react";
import { useTranslations } from "next-intl";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
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
    <Button
      type="button"
      variant="outline"
      size={variant === "labeled" ? "default" : "icon"}
      onClick={onClick}
      disabled={busy}
      className={cn(
        "shrink-0",
        variant === "labeled" && "min-w-0 whitespace-nowrap",
        saved && "border-[rgba(37,99,235,0.32)] text-foreground",
        className,
      )}
      aria-pressed={saved}
      aria-label={label}
      title={label}
    >
      <Bookmark className={cn("h-4 w-4", saved && "fill-current")} aria-hidden />
      {variant === "labeled" ? <span>{label}</span> : null}
    </Button>
  );
}
