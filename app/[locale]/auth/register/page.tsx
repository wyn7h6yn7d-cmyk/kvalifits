import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AlreadySignedIn } from "@/components/auth/AlreadySignedIn";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ locale: string }> };

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("registerTitle")} subtitle={t("registerSubtitle")}>
          {user ? <AlreadySignedIn /> : <RegisterForm locale={locale} />}
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}

