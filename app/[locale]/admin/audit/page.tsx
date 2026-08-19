import { getTranslations } from "next-intl/server";

import { AdminAuditLogView } from "@/components/admin/AdminAuditLogView";
import { AdminShell } from "@/components/admin/AdminShell";
import { parseAdminAuditParams } from "@/lib/admin/auditLogView";
import { loadAdminAuditLog } from "@/lib/admin/loadAdminAuditLog";
import { requireAdmin } from "@/lib/admin/requireAdmin";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function AdminAuditPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const { supabase } = await requireAdmin(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const filters = parseAdminAuditParams(sp);
  const result = await loadAdminAuditLog(supabase, filters);

  return (
    <AdminShell title={t("auditTitle")} subtitle={t("auditSubtitle")} maxWidthClassName="max-w-6xl">
      <AdminAuditLogView locale={locale} filters={filters} result={result} />
    </AdminShell>
  );
}
