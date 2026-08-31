"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { mapAuthError } from "@/lib/auth/mapAuthError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MfaChallengeForm({ nextPath }: { locale: string; nextPath: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors();
      if (listErr) throw listErr;
      const totp = factors?.totp?.find((f) => f.status === "verified");
      if (!totp) {
        throw new Error(t("mfaNoFactor"));
      }
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: totp.id,
      });
      if (challengeErr) throw challengeErr;
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: totp.id,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verifyErr) throw verifyErr;
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{t("mfaChallengeHint")}</p>
      <div className="space-y-2">
        <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("mfaCode")}</label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          minLength={6}
          maxLength={8}
          placeholder="123456"
        />
      </div>
      {error ? (
        <div className="rounded-2xl border border-border bg-[#f8fafc] px-4 py-3 text-sm text-muted">
          {error}
        </div>
      ) : null}
      <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} loadingText={t("loading")}>
        {t("mfaVerifyCta")}
      </Button>
    </form>
  );
}
