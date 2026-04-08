import { redirect } from "next/navigation";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountIndex({ params }: Props) {
  const { locale } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const { role, nextPath } = await getRoleAndNextPath(locale);

  if (nextPath.includes("/onboarding/")) {
    redirect(nextPath);
  }

  if (role === "seeker") redirect(`/${locale}/account/seeker`);
  if (role === "employer") redirect(`/${locale}/account/employer`);

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]" />
      <Footer />
    </div>
  );
}

