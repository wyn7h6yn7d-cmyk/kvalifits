"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { mapAuthError } from "@/lib/auth/mapAuthError";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Role = "seeker" | "employer";

export function RegisterForm({
  locale,
  defaultRole,
}: {
  locale: string;
  /** When set (e.g. from /tooandjatele or /toootsijatele), radio is pre-selected. */
  defaultRole?: Role;
}) {
  const t = useTranslations("auth");
  const router = useRouter();

  const roleLocked = defaultRole != null;
  const [role, setRole] = useState<Role>(defaultRole ?? "seeker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!termsAccepted) {
        throw new Error(t("registerTermsRequired"));
      }
      if (password !== passwordConfirm) {
        throw new Error(t("errorPasswordMismatch"));
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role,
          locale,
          termsAccepted: true,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        code?: string | null;
        needsEmailVerification?: boolean;
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
        if (json.error === "terms_required") {
          setError(t("registerTermsRequired"));
          return;
        }
        if (json.error === "weak_password") {
          setError(t("errorWeakPassword"));
          return;
        }
        if (json.error === "signup_no_user") {
          setError(t("signupNoUser"));
          return;
        }
        if (json.error === "profile_failed") {
          const msg = (json.message ?? "").toLowerCase();
          if (
            msg.includes("terms_accepted_at") ||
            msg.includes("terms_version") ||
            msg.includes("privacy_version") ||
            msg.includes("schema cache")
          ) {
            setError(`${mapAuthError({ message: json.message }, t)}\n\n${t("registerTermsFixHint")}`);
            return;
          }
        }
        setError(mapAuthError({ message: json.message, code: json.code }, t));
        return;
      }

      if (json.needsEmailVerification) {
        router.push(`/${locale}/auth/login?signup=check-email`);
        return;
      }

      router.push(`/${locale}/onboarding`);
      router.refresh();
    } catch (err) {
      setError(mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {roleLocked ? null : (
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium tracking-wide text-white/65">
            {t("roleLabel")}
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/75">
              <input
                type="radio"
                name="role"
                value="seeker"
                checked={role === "seeker"}
                onChange={() => setRole("seeker")}
              />
              <span className="font-medium text-white/85">{t("roleSeeker")}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/75">
              <input
                type="radio"
                name="role"
                value="employer"
                checked={role === "employer"}
                onChange={() => setRole("employer")}
              />
              <span className="font-medium text-white/85">{t("roleEmployer")}</span>
            </label>
          </div>
        </fieldset>
      )}

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
          autoComplete="new-password"
          required
          minLength={8}
          placeholder={t("passwordPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">
          {t("passwordConfirm")}
        </label>
        <Input
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder={t("passwordConfirmPlaceholder")}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.10] bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-white/70">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          required
          className="mt-0.5"
          aria-required="true"
        />
        <span>
          {t.rich("registerTermsConsent", {
            terms: (chunks) => (
              <Link
                href="/tingimused"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-white/85 underline decoration-white/30 underline-offset-2 hover:decoration-white/55"
                onClick={(e) => e.stopPropagation()}
              >
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link
                href="/privaatsus"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-white/85 underline decoration-white/30 underline-offset-2 hover:decoration-white/55"
                onClick={(e) => e.stopPropagation()}
              >
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>

      {error ? (
        <div className="whitespace-pre-wrap rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className={cn("w-full", !termsAccepted && "opacity-60")}
        loading={loading}
        loadingText={t("loading")}
        disabled={!termsAccepted || loading}
      >
        {t("registerCta")}
      </Button>

      <div className="text-center text-xs text-white/55">
        <a href={`/${locale}/auth/login`} className="hover:text-white/75">
          {t("alreadyHaveAccount")}
        </a>
      </div>
    </form>
  );
}
