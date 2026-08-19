"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { mapAuthError } from "@/lib/auth/mapAuthError";
import { reportException } from "@/lib/monitoring/report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ locale, promptResend = false }: { locale: string; promptResend?: boolean }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(promptResend);
  const [resendSent, setResendSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResendSent(false);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        code?: string | null;
      };
      if (!res.ok) {
        if (json.error === "missing_rate_limit_table") {
          setError(t("errorRateLimitTable"));
          return;
        }
        if (json.error === "rate_limited" || res.status === 429) {
          setError(t("errorRateLimited"));
          return;
        }
        if (json.error === "email_not_confirmed") {
          setUnverified(true);
          setError(t("errorEmailNotConfirmed"));
          return;
        }
        if (json.error === "account_blocked") {
          setError(t("errorAccountBlocked"));
          return;
        }
        setError(mapAuthError({ message: json.message, code: json.code }, t));
        return;
      }
      router.push(`/${locale}/onboarding`);
      router.refresh();
    } catch (err) {
      reportException(err, { area: "auth", code: "login_network_error" });
      setError(mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  }

  async function onResendVerification() {
    setResending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (json.error === "missing_email") {
          setError(t("errorInvalidEmail"));
          return;
        }
        if (json.error === "missing_rate_limit_table") {
          setError(t("errorRateLimitTable"));
          return;
        }
        if (json.error === "rate_limited" || res.status === 429) {
          setError(t("errorRateLimited"));
          return;
        }
        setError(t("errorRateLimited"));
        return;
      }
      setResendSent(true);
    } catch (err) {
      reportException(err, { area: "auth", code: "resend_network_error" });
      setError(mapAuthError(err, t));
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">
          {t("email")}
        </label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          required
          placeholder={t("emailPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">
          {t("password")}
        </label>
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          required
          placeholder={t("passwordPlaceholder")}
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {error}
        </div>
      ) : null}

      {resendSent ? (
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {t("resendVerificationSent")}
        </div>
      ) : null}

      {unverified ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          loading={resending}
          loadingText={t("loading")}
          disabled={!email.trim()}
          onClick={() => void onResendVerification()}
        >
          {t("resendVerificationCta")}
        </Button>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        loading={loading}
        loadingText={t("loading")}
      >
        {t("login")}
      </Button>

      <div className="flex items-center justify-between text-xs text-white/55">
        <a
          href={`/${locale}/auth/forgot-password`}
          className="hover:text-white/75"
        >
          {t("forgotPassword")}
        </a>
        <a href={`/${locale}/auth/register`} className="hover:text-white/75">
          {t("createAccount")}
        </a>
      </div>
    </form>
  );
}
