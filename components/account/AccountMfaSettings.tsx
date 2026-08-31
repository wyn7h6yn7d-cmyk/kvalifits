"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  assertAal2AfterVerify,
  canUnenrollFactor,
  factorIdsForFullDisable,
  getVerifiedTotpFactors,
  isInvalidMfaCode,
  mapAccountMfaError,
  resolveVerificationFactor,
  type TotpFactor,
} from "@/lib/auth/accountMfa";
import { mapAuthError } from "@/lib/auth/mapAuthError";
import { KF_RADIX_OVERLAY } from "@/lib/site/microMotion";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function AccountMfaSettings({ className }: Props) {
  const t = useTranslations("accountSecurity");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [ready, setReady] = useState(false);
  const [verifiedFactors, setVerifiedFactors] = useState<TotpFactor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [enrollCode, setEnrollCode] = useState("");

  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [verifyFactorId, setVerifyFactorId] = useState<string | null>(null);

  const hasVerified = verifiedFactors.length > 0;

  const refreshFactors = useCallback(async () => {
    const { data, error: listErr } = await supabase.auth.mfa.listFactors();
    if (listErr) throw listErr;
    const verified = getVerifiedTotpFactors(data);
    setVerifiedFactors(verified);
    setVerifyFactorId((current) => resolveVerificationFactor(verified, current)?.id ?? null);
    return verified;
  }, [supabase]);

  useEffect(() => {
    void (async () => {
      try {
        await refreshFactors();
      } catch {
        setError(t("errLoad"));
      } finally {
        setReady(true);
      }
    })();
  }, [refreshFactors, t]);

  async function startEnroll() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Kvalifits",
        issuer: "Kvalifits",
      });
      if (enrollErr) throw enrollErr;
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (err) {
      setError(mapAuthError(err, tAuth));
    } finally {
      setLoading(false);
    }
  }

  async function confirmEnroll() {
    if (!factorId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeErr) throw challengeErr;
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: enrollCode.trim(),
      });
      if (verifyErr) throw verifyErr;
      await refreshFactors();
      setFactorId(null);
      setQr(null);
      setSecret(null);
      setEnrollCode("");
      setSuccess(t("enableSuccess"));
      router.refresh();
    } catch (err) {
      setError(isInvalidMfaCode(err) ? t("errInvalidCode") : mapAuthError(err, tAuth));
    } finally {
      setLoading(false);
    }
  }

  function openDisableModal() {
    setDisableOpen(true);
    setDisableCode("");
    setError(null);
    setSuccess(null);
    setVerifyFactorId(resolveVerificationFactor(verifiedFactors)?.id ?? null);
  }

  async function confirmDisable() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const verified = await refreshFactors();
      const verifyFactor = resolveVerificationFactor(verified, verifyFactorId);
      if (!verifyFactor) {
        setError(t("errNoFactor"));
        return;
      }

      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: verifyFactor.id,
      });
      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: verifyFactor.id,
        challengeId: challenge.id,
        code: disableCode.trim(),
      });
      if (verifyErr) {
        setError(isInvalidMfaCode(verifyErr) ? t("errInvalidCode") : mapAuthError(verifyErr, tAuth));
        return;
      }

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const aalGate = assertAal2AfterVerify(aal);
      if (!aalGate.ok) {
        setError(mapAccountMfaError(aalGate.error, t));
        return;
      }

      const { data: factorsAfter, error: listErr } = await supabase.auth.mfa.listFactors();
      if (listErr) throw listErr;
      const verifiedAfter = getVerifiedTotpFactors(factorsAfter);
      const factorIds = factorIdsForFullDisable(verifiedAfter);

      for (const id of factorIds) {
        const gate = canUnenrollFactor({ verifiedFactors: verifiedAfter, factorId: id });
        if (!gate.ok) {
          setError(mapAccountMfaError(gate.error, t));
          return;
        }
        const { error: unenrollErr } = await supabase.auth.mfa.unenroll({ factorId: id });
        if (unenrollErr) throw unenrollErr;
      }

      await refreshFactors();
      setDisableOpen(false);
      setDisableCode("");
      setSuccess(t("disableSuccess"));
      router.refresh();
    } catch (err) {
      setError(isInvalidMfaCode(err) ? t("errInvalidCode") : mapAuthError(err, tAuth));
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return <div className={cn("text-sm text-muted-2", className)}>{tAuth("loading")}</div>;
  }

  return (
    <div className={cn("rounded-3xl border border-border bg-[#f8fafc] p-5 sm:p-6", className)}>
      <div className="text-sm font-medium text-foreground/80">{t("mfaTitle")}</div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-2">{t("mfaSubtitle")}</p>

      {success ? (
        <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] px-3 py-2 text-xs text-emerald-800/95">
          {success}
        </div>
      ) : null}

      {hasVerified ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-border bg-white px-4 py-3">
            <div className="text-sm font-medium text-foreground/85">{t("mfaTitle")}</div>
            <div className="mt-1 text-xs text-muted-2">
              {t("statusLabel")}: <span className="font-medium text-emerald-800/90">{t("statusActive")}</span>
            </div>
            {verifiedFactors.length > 1 ? (
              <p className="mt-2 text-[11px] leading-relaxed text-muted-2">{t("multipleFactorsHint")}</p>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl px-3 text-[13px]"
            onClick={openDisableModal}
          >
            {t("disableCta")}
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-border bg-white px-4 py-3">
            <div className="text-sm font-medium text-foreground/85">{t("mfaTitle")}</div>
            <div className="mt-1 text-xs text-muted-2">
              {t("statusLabel")}: <span className="font-medium text-muted">{t("statusInactive")}</span>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-2">{t("enableIntro")}</p>

          {!factorId ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="h-9 rounded-xl px-3 text-[13px]"
              loading={loading}
              loadingText={tAuth("loading")}
              onClick={() => void startEnroll()}
            >
              {t("enableCta")}
            </Button>
          ) : (
            <div className="space-y-4">
              {qr ? (
                <div className="flex justify-center rounded-2xl border border-border bg-white p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="" className="h-48 w-48" />
                </div>
              ) : null}
              {secret ? (
                <p className="break-all text-xs text-muted-2">
                  {t("backupSecret")}: <span className="font-mono text-muted">{secret}</span>
                </p>
              ) : null}
              <div className="space-y-2">
                <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{tAuth("mfaCode")}</label>
                <Input
                  value={enrollCode}
                  onChange={(e) => setEnrollCode(e.target.value.replace(/\s/g, ""))}
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
                size="sm"
                className="h-9 rounded-xl px-3 text-[13px]"
                loading={loading}
                loadingText={tAuth("loading")}
                onClick={() => void confirmEnroll()}
              >
                {t("enableConfirmCta")}
              </Button>
            </div>
          )}
        </div>
      )}

      {error && !disableOpen ? (
        <div className="mt-4 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-muted">{error}</div>
      ) : null}

      <DialogPrimitive.Root open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className={cn("fixed inset-0 z-[80] bg-black/70", KF_RADIX_OVERLAY)} />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-[90] w-[min(calc(100vw-2rem),28rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-[#f8fafc] p-5 shadow-xl sm:p-6",
              "kf-dialog-sheet",
            )}
          >
            <DialogPrimitive.Title className="text-base font-semibold text-foreground">
              {t("disableModalTitle")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-sm leading-relaxed text-muted">
              {t("disableModalWarning")}
            </DialogPrimitive.Description>

            {verifiedFactors.length > 1 ? (
              <div className="mt-4 space-y-2">
                <label className="text-xs font-medium text-muted-2" htmlFor="mfa-verify-factor">
                  {t("verifyFactorLabel")}
                </label>
                <select
                  id="mfa-verify-factor"
                  value={verifyFactorId ?? ""}
                  onChange={(e) => setVerifyFactorId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground/85 outline-none focus:border-[rgba(37,99,235,0.35)]"
                >
                  {verifiedFactors.map((factor) => (
                    <option key={factor.id} value={factor.id}>
                      {factor.friendly_name?.trim() || t("defaultFactorName")}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="mt-4 space-y-2">
              <label className="text-[0.9375rem] font-medium leading-snug text-foreground" htmlFor="mfa-disable-code">
                {tAuth("mfaCode")}
              </label>
              <Input
                id="mfa-disable-code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\s/g, ""))}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                minLength={6}
                maxLength={8}
                placeholder="123456"
              />
            </div>

            {error && disableOpen ? (
              <div className="mt-3 rounded-xl border border-border bg-white px-3 py-2 text-xs text-muted">{error}</div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl px-3 text-[13px]"
                disabled={loading}
                onClick={() => setDisableOpen(false)}
              >
                {t("disableCancel")}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="h-9 rounded-xl px-3 text-[13px]"
                disabled={loading || disableCode.trim().length < 6}
                loading={loading}
                loadingText={t("disableLoading")}
                onClick={() => void confirmDisable()}
              >
                {t("disableConfirmCta")}
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
