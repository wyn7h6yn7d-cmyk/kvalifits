"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Role = "seeker" | "employer";

export function RegisterForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const router = useRouter();

  const [role, setRole] = useState<Role>("seeker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/${locale}/auth/callback`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });
      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) {
        throw new Error(t("signupNoUser"));
      }

      // If email confirmations are enabled, there might not be a session yet.
      // In MVP we recommend disabling confirmations, so this becomes a single-step flow.
      const hasSession = Boolean(data.session);
      if (!hasSession) {
        router.push(`/${locale}/auth/login?signup=check-email`);
        return;
      }

      // 1) Create primary role row
      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: userId,
        role,
        email,
      });
      if (profileErr) throw profileErr;

      // 2) Create role-specific profile placeholder row
      if (role === "seeker") {
        const { error: seekerErr } = await supabase.from("seeker_profiles").insert({
          user_id: userId,
          full_name: "",
          phone: "",
          location: "",
          profile_title: "",
          about: "",
          skills: [],
          experience_level: "",
          preferred_job_types: [],
          preferred_locations: [],
          profile_visible: false,
          completion_percent: 0,
          is_complete: false,
        });
        // If row already exists, ignore
        if (seekerErr && seekerErr.code !== "23505") throw seekerErr;

        router.push(`/${locale}/onboarding/seeker`);
        router.refresh();
        return;
      }

      // employer
      const { error: employerErr } = await supabase.from("employer_profiles").insert({
        owner_user_id: userId,
        company_name: "",
        contact_email: email,
        company_description: "",
        location: "",
      });
      if (employerErr && employerErr.code !== "23505") throw employerErr;

      router.push(`/${locale}/onboarding/employer`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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

      {error ? (
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
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
        {loading ? t("loading") : t("registerCta")}
      </Button>

      <div className="text-center text-xs text-white/55">
        <a href={`/${locale}/auth/login`} className="hover:text-white/75">
          {t("alreadyHaveAccount")}
        </a>
      </div>
    </form>
  );
}

