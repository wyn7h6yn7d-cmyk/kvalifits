import { getTranslations } from "next-intl/server";

import { AdminShell } from "@/components/admin/AdminShell";
import { Link } from "@/i18n/routing";
import { requireAdmin } from "@/lib/admin/requireAdmin";

type Props = { params: Promise<{ locale: string }> };

function HubCard({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border bg-[#f8fafc] p-5 text-sm text-foreground/80 transition-colors hover:bg-[#f5f7fb]"
    >
      <div className="font-medium text-foreground">{title}</div>
      <div className="mt-1 text-sm leading-relaxed text-muted-2">{body}</div>
    </Link>
  );
}

export default async function AdminIndex({ params }: Props) {
  const { locale } = await params;
  await requireAdmin(locale);
  const t = await getTranslations({ locale, namespace: "admin" });

  return (
    <AdminShell title={t("title")} subtitle={t("subtitle")} maxWidthClassName="max-w-4xl">
      <div className="space-y-8">
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-2">{t("hubReview")}</h2>
          <p className="mt-1 text-sm text-muted-2">{t("hubReviewHint")}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <HubCard href="/admin/moderation" title={t("moderationTitle")} body={t("moderationSubtitle")} />
            <HubCard href="/admin/reports" title={t("reportsTitle")} body={t("reportsSubtitle")} />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-2">{t("hubContent")}</h2>
          <p className="mt-1 text-sm text-muted-2">{t("hubContentHint")}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <HubCard href="/admin/jobs" title={t("jobsTitle")} body={t("jobsSubtitle")} />
            <HubCard href="/admin/employers" title={t("employersTitle")} body={t("employersSubtitle")} />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-2">{t("hubAccounts")}</h2>
          <p className="mt-1 text-sm text-muted-2">{t("hubAccountsHint")}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <HubCard href="/admin/users" title={t("usersTitle")} body={t("usersSubtitle")} />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-2">{t("hubSettings")}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <HubCard href="/admin/audit" title={t("auditTitle")} body={t("auditSubtitle")} />
            <HubCard href="/admin/security" title={t("securityTitle")} body={t("securitySubtitle")} />
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
