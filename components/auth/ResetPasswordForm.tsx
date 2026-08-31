"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { mapAuthError } from "@/lib/auth/mapAuthError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SITE_DARK_NOTICE } from "@/lib/site/publicPageLayout";

export function ResetPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push(`/${locale}/auth/login?reset=success`);
      router.refresh();
    } catch (err) {
      setError(mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-[0.9375rem] font-medium leading-snug text-foreground">
          {t("newPassword")}
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

      {error ? (
        <div className={SITE_DARK_NOTICE}>
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
        {loading ? t("loading") : t("updatePassword")}
      </Button>
    </form>
  );
}

