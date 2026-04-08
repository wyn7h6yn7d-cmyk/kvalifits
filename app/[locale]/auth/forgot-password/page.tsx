import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

type Props = { params: Promise<{ locale: string }> };

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("forgotPasswordTitle")} subtitle={t("forgotPasswordSubtitle")}>
          <ForgotPasswordForm locale={locale} />
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}

