import { redirect } from "next/navigation";

import { getRoleAndNextPath } from "@/lib/onboarding/flow";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountIndex({ params }: Props) {
  const { locale } = await params;
  const { user, role, nextPath } = await getRoleAndNextPath(locale);

  if (!user) redirect(nextPath);

  if (nextPath.includes("/onboarding/")) {
    redirect(nextPath);
  }

  if (role === "seeker") redirect(`/${locale}/account/seeker`);
  if (role === "employer") redirect(`/${locale}/account/employer`);
  if (role === "admin") redirect(`/${locale}/admin`);

  redirect(nextPath);
}
