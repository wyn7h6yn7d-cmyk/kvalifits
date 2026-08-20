"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { mapAuthError } from "@/lib/auth/mapAuthError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Admin TOTP enrollment — prepares MFA without changing the public login UI.
 */
export function AdminMfaSetupPanel({ nextPath }: { locale: string; nextPath: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVerified, setHasVerified] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      setHasVerified(Boolean(data?.totp?.some((f) => f.status === "verified")));
      setReady(true);
    })();
  }, [supabase]);

  async function startEnroll() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Kvalifits Admin",
        issuer: "Kvalifits",
      });
      if (enrollErr) throw enrollErr;
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (err) {
      setError(mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  }

  async function confirmEnroll() {
    if (!factorId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeErr) throw challengeErr;
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verifyErr) throw verifyErr;
      setHasVerified(true);
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return <div className="text-sm text-white/55">{t("loading")}</div>;
  }

  if (hasVerified && !factorId) {
    return null;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-white/60">{t("adminMfaIntro")}</p>

      {!factorId ? (
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          loadingText={t("loading")}
          onClick={() => void startEnroll()}
        >
          {t("adminMfaStartCta")}
        </Button>
      ) : (
        <div className="space-y-4">
          {qr ? (
            <div className="flex justify-center rounded-2xl border border-white/[0.10] bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="" className="h-48 w-48" />
            </div>
          ) : null}
          {secret ? (
            <p className="break-all text-xs text-white/50">
              {t("adminMfaSecret")}: <span className="font-mono text-white/75">{secret}</span>
            </p>
          ) : null}
          <div className="space-y-2">
            <label className="text-xs font-medium tracking-wide text-white/65">{t("mfaCode")}</label>
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
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            loadingText={t("loading")}
            onClick={() => void confirmEnroll()}
          >
            {t("adminMfaConfirmCta")}
          </Button>
        </div>
      )}

      {error ? (
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {error}
        </div>
      ) : null}
    </div>
  );
}
