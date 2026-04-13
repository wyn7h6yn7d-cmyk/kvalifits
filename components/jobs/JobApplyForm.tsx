"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

type Props = {
  locale: string;
  jobPostId: string;
};

export function JobApplyForm({ locale, jobPostId }: Props) {
  const t = useTranslations("jobs");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [authLoading, setAuthLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const [coverLetter, setCoverLetter] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!mounted) return;
        if (!user) {
          setAuthed(false);
          setRole(null);
          return;
        }
        setAuthed(true);
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        setRole((prof?.role ?? user.user_metadata?.role ?? null) as any);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError(t("applyConsentRequired"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/job-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobPostId, coverLetter, consentToShare: true }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (res.status === 409 && json.error === "duplicate_application") {
          setError(t("applyDuplicate"));
          return;
        }
        if (res.status === 400 && json.error === "seeker_profile_required") {
          setError(t("applyProfileRequired"));
          return;
        }
        setError(t("applyFailed"));
        return;
      }
      setSuccess(true);
    } catch {
      setError(t("applyFailed"));
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <div className="text-sm text-white/60">{t("applyLoading")}</div>;
  }

  if (!authed) {
    return (
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="text-sm font-medium text-white/85">{t("applyTitle")}</div>
        <div className="mt-1 text-sm text-white/60">{t("applyLoginHint")}</div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link href="/auth/login" className="text-sm font-medium text-white/80 underline hover:text-white">
            {t("applyLogin")}
          </Link>
          <span className="hidden text-white/25 sm:inline">•</span>
          <Link href="/auth/register" className="text-sm font-medium text-white/80 underline hover:text-white">
            {t("applyRegister")}
          </Link>
        </div>
      </div>
    );
  }

  if (role !== "seeker") {
    return (
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="text-sm font-medium text-white/85">{t("applyTitle")}</div>
        <div className="mt-1 text-sm text-white/60">{t("applyOnlySeekers")}</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="text-sm font-medium text-white/85">{t("applySuccessTitle")}</div>
        <div className="mt-1 text-sm text-white/60">{t("applySuccessBody")}</div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
      <div className="text-sm font-medium text-white/85">{t("applyTitle")}</div>
      <div className="mt-1 text-sm text-white/60">{t("applySubtitle")}</div>

      <div className="mt-4 space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">{t("applyMessageLabel")}</label>
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          rows={5}
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
          placeholder={t("applyMessagePlaceholder")}
        />
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.10] bg-white/[0.02] px-4 py-3 text-sm text-white/70">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>{t("applyConsent")}</span>
      </label>

      {error ? (
        <div className="mt-4 rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {error}
        </div>
      ) : null}

      <div className="mt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          loadingText={t("applySending")}
        >
          {t("applyCta")}
        </Button>
      </div>
    </form>
  );
}

