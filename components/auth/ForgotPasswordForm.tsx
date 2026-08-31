"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

import { mapAuthError } from "@/lib/auth/mapAuthError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
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
      setSent(true);
    } catch (err) {
      setError(mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-[#f8fafc] px-4 py-3 text-sm text-muted">
        {t("resetEmailSent")}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-[0.9375rem] font-medium leading-snug text-foreground">
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

      {error ? (
        <div className="rounded-2xl border border-border bg-[#f8fafc] px-4 py-3 text-sm text-muted">
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading ? t("loading") : t("sendResetLink")}
      </Button>
    </form>
  );
}
