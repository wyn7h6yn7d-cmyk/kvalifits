import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { AlreadySignedIn } from "@/components/auth/AlreadySignedIn";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ signup?: string; reset?: string; error?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "auth" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const notice =
    sp.signup === "check-email"
      ? t("checkEmailNotice")
      : sp.reset === "success"
        ? t("resetSuccessNotice")
        : sp.error === "email_not_confirmed"
          ? t("errorEmailNotConfirmed")
          : null;

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("loginTitle")} subtitle={t("loginSubtitle")}>
          {notice ? (
            <div className="mb-4 rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
              {notice}
            </div>
          ) : null}
          {user ? <AlreadySignedIn /> : <LoginForm locale={locale} />}
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}
