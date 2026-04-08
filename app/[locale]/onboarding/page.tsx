import { redirect } from "next/navigation";

import { routing, type AppLocale } from "@/i18n/routing";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";

type Props = { params: Promise<{ locale: string }> };

export default async function OnboardingIndex({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) {
    redirect(`/${routing.defaultLocale}`);
  }

  const { nextPath } = await getRoleAndNextPath(locale);
  redirect(nextPath);
}

