import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/routing";
import {
  ADMIN_AUDIT_ACTION_OPTIONS,
  ADMIN_AUDIT_PATH,
  ADMIN_AUDIT_TARGET_TYPES,
  buildAdminAuditLogUrl,
  shortenAuditId,
  type AdminAuditFilters,
} from "@/lib/admin/auditLogView";
import type { AdminAuditLogPage, AdminAuditLogRow } from "@/lib/admin/loadAdminAuditLog";
import { SITE_DARK_FIELD, SITE_DARK_INSET } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

const fieldClass = cn(
  "h-12 w-full px-4 font-sans text-base lg:h-11 lg:text-sm",
  SITE_DARK_FIELD,
);

type AdminT = Awaited<ReturnType<typeof getTranslations>>;

function labeled(t: AdminT, key: string, fallback: string): string {
  return t.has(key) ? t(key) : fallback;
}

function formatTimestamp(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso || "—";
  return new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(date);
}

function RowMeta({
  t,
  locale,
  row,
}: {
  t: AdminT;
  locale: string;
  row: AdminAuditLogRow;
}) {
  const action = labeled(t, `auditActions.${row.action}`, row.action);
  const targetType = labeled(t, `auditTargets.${row.targetType}`, row.targetType);
  return (
    <>
      <div className="text-xs text-muted-2">{formatTimestamp(row.timestamp, locale)}</div>
      <div className="mt-1 text-sm text-foreground">{action}</div>
      <div className="mt-1 text-[13px] text-muted">
        <span className="break-all">{row.actorLabel}</span>
        <span className="text-muted-2"> · </span>
        <span>{targetType}</span>
        <span className="text-muted-2"> · </span>
        <span className="font-mono text-[12px]" title={row.targetId}>
          {shortenAuditId(row.targetId)}
        </span>
      </div>
      <div className="mt-2 break-words font-mono text-[12px] leading-relaxed text-muted-2">
        {row.summary || t("auditDetailsEmpty")}
      </div>
    </>
  );
}

export async function AdminAuditLogView({
  locale,
  filters,
  result,
}: {
  locale: string;
  filters: AdminAuditFilters;
  result: AdminAuditLogPage;
}) {
  const t = await getTranslations({ locale, namespace: "admin" });
  const { rows, page, totalPages, schemaMissing } = result;
  const hasFilters = Boolean(
    filters.action || filters.actor || filters.targetType || filters.from || filters.to,
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-2">{t("auditReadOnlyHint")}</p>

      <form method="get" action={`/${locale}/admin/audit`} className={cn(SITE_DARK_INSET, "rounded-2xl p-4 sm:p-5")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-2">{t("auditFilterAction")}</span>
            <select name="action" defaultValue={filters.action ?? ""} className={fieldClass}>
              <option value="">{t("auditFilterAll")}</option>
              {ADMIN_AUDIT_ACTION_OPTIONS.map((action) => (
                <option key={action} value={action}>
                  {labeled(t, `auditActions.${action}`, action)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-2">{t("auditFilterActor")}</span>
            <Input
              name="actor"
              type="search"
              defaultValue={filters.actor ?? ""}
              placeholder={t("auditFilterActorPlaceholder")}
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-2">{t("auditFilterTargetType")}</span>
            <select name="type" defaultValue={filters.targetType ?? ""} className={fieldClass}>
              <option value="">{t("auditFilterAll")}</option>
              {ADMIN_AUDIT_TARGET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {labeled(t, `auditTargets.${type}`, type)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-2">{t("auditFilterFrom")}</span>
            <Input name="from" type="date" defaultValue={filters.from ?? ""} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-2">{t("auditFilterTo")}</span>
            <Input name="to" type="date" defaultValue={filters.to ?? ""} />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm">
            {t("auditFilterApply")}
          </Button>
          {hasFilters ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={ADMIN_AUDIT_PATH}>{t("auditFilterClear")}</Link>
            </Button>
          ) : null}
        </div>
      </form>

      {schemaMissing ? (
        <p className="text-sm text-muted-2">{t("auditSchemaMissing")}</p>
      ) : !rows.length ? (
        <p className="text-sm text-muted-2">{t("auditEmpty")}</p>
      ) : (
        <>
          <ul className="divide-y divide-white/[0.06] sm:hidden">
            {rows.map((row) => (
              <li key={row.id} className="py-4 first:pt-0">
                <RowMeta t={t} locale={locale} row={row} />
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-muted-2">
                  <th className="py-2 pr-3 font-medium">{t("auditColTime")}</th>
                  <th className="py-2 pr-3 font-medium">{t("auditColActor")}</th>
                  <th className="py-2 pr-3 font-medium">{t("auditColAction")}</th>
                  <th className="py-2 pr-3 font-medium">{t("auditColTargetType")}</th>
                  <th className="py-2 pr-3 font-medium">{t("auditColTargetId")}</th>
                  <th className="py-2 font-medium">{t("auditColDetails")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-white/[0.05] align-top">
                    <td className="whitespace-nowrap py-3 pr-3 text-body">
                      {formatTimestamp(row.timestamp, locale)}
                    </td>
                    <td className="max-w-[12rem] break-all py-3 pr-3 text-foreground/80">{row.actorLabel}</td>
                    <td className="py-3 pr-3 text-foreground/80">
                      {labeled(t, `auditActions.${row.action}`, row.action)}
                    </td>
                    <td className="py-3 pr-3 text-body">
                      {labeled(t, `auditTargets.${row.targetType}`, row.targetType)}
                    </td>
                    <td className="py-3 pr-3 font-mono text-[12px] text-body" title={row.targetId}>
                      {shortenAuditId(row.targetId)}
                    </td>
                    <td
                      className={cn(
                        "max-w-[18rem] break-words py-3 font-mono text-[12px] leading-relaxed text-muted-2",
                      )}
                    >
                      {row.summary || t("auditDetailsEmpty")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={buildAdminAuditLogUrl({ ...filters, page: page - 1 })}>
                {t("auditPagePrev")}
              </Link>
            </Button>
          ) : (
            <span />
          )}
          <p className="text-[13px] text-muted-2">
            {t("auditPageStatus", { page, pages: totalPages })}
          </p>
          {page < totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={buildAdminAuditLogUrl({ ...filters, page: page + 1 })}>
                {t("auditPageNext")}
              </Link>
            </Button>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </div>
  );
}
