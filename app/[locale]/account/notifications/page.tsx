import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { NotificationsInbox } from "@/components/notifications/NotificationsInbox";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import type { NotificationRow } from "@/lib/notifications/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

export default async function NotificationsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notifications" });
  const { user, nextPath } = await getRoleAndNextPath(locale);
  if (!user) redirect(nextPath);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("id,user_id,type,entity_type,entity_id,payload,created_at,read_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const missing = Boolean(error && /notifications|schema cache|does not exist/i.test(error.message ?? ""));
  if (error && !missing) throw error;

  const rows = ((data ?? []) as NotificationRow[]).map((row) => ({
    ...row,
    payload: row.payload && typeof row.payload === "object" ? (row.payload as Record<string, unknown>) : {},
  }));

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")} maxWidthClassName="max-w-3xl">
      <NotificationsInbox locale={locale} userId={user.id} initialRows={rows} />
    </AuthShell>
  );
}
