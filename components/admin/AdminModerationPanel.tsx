"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";

import {
  isJobPostReportReason,
  type JobPostReportReason,
} from "@/lib/jobs/jobPostReport";
import type { AdminModerationAction, ModerationQueue } from "@/lib/admin/moderationTypes";
import { Button } from "@/components/ui/button";
import { errorMessageFromUnknown } from "@/lib/utils";
import { parseCertificateVerificationStatus } from "@/lib/seeker/certificateVerification";
import { parseEmployerCompanyVerificationStatus } from "@/lib/employer/companyVerification";
import {
  CertificateStatusBlock,
  certificateViewLabelsFromT,
} from "@/components/seeker/CertificateVerificationBadge";
import { CompanyVerificationBadge } from "@/components/employer/CompanyVerificationBadge";

export type ModerationReportItem = {
  id: string;
  job_post_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  job_title?: string;
  employer_name?: string;
};

export type ModerationCertificateItem = {
  id: string;
  user_id: string;
  certificate_name: string | null;
  certificate_issuer: string | null;
  verification_status: string;
  created_at?: string | null;
  owner_email?: string | null;
};

export type ModerationCompanyItem = {
  id: string;
  company_name: string | null;
  registry_code: string | null;
  contact_email: string | null;
  verification_status: string;
  created_at?: string | null;
};

export type ModerationBlockedUserItem = {
  id: string;
  email: string | null;
  role: string | null;
  created_at?: string | null;
};

type Props = {
  reports: ModerationReportItem[];
  certificates: ModerationCertificateItem[];
  companies: ModerationCompanyItem[];
  blockedUsers: ModerationBlockedUserItem[];
};

const REPORT_ACTIONS: AdminModerationAction[] = [
  "approve",
  "reject",
  "hide",
  "block",
  "restore",
];
const CERT_ACTIONS: AdminModerationAction[] = ["approve", "reject", "hide", "block", "restore"];
const COMPANY_ACTIONS: AdminModerationAction[] = ["approve", "reject", "hide", "block", "restore"];
const BLOCKED_ACTIONS: AdminModerationAction[] = ["restore"];

function ActionButtons({
  queue,
  targetId,
  actions,
  busyKey,
  onAction,
  labels,
}: {
  queue: ModerationQueue;
  targetId: string;
  actions: AdminModerationAction[];
  busyKey: string | null;
  onAction: (queue: ModerationQueue, action: AdminModerationAction, targetId: string) => void;
  labels: Record<AdminModerationAction, string>;
}) {
  const key = `${queue}:${targetId}`;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action}
          type="button"
          size="sm"
          variant={action === "approve" || action === "restore" ? "primary" : "outline"}
          className="h-9 rounded-xl px-3 text-[13px]"
          disabled={busyKey === key}
          onClick={() => onAction(queue, action, targetId)}
        >
          {labels[action]}
        </Button>
      ))}
    </div>
  );
}

export function AdminModerationPanel({
  reports,
  certificates,
  companies,
  blockedUsers,
}: Props) {
  const t = useTranslations("admin");
  const tOnb = useTranslations("onboarding");
  const locale = useLocale();
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const labels: Record<AdminModerationAction, string> = {
    approve: t("actionApprove"),
    reject: t("actionReject"),
    hide: t("actionHide"),
    block: t("actionBlock"),
    restore: t("actionRestore"),
  };

  async function runAction(
    queue: ModerationQueue,
    action: AdminModerationAction,
    targetId: string
  ) {
    const key = `${queue}:${targetId}`;
    setBusyKey(key);
    setError(null);
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queue, action, targetId }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error || t("unknownError"));
      }
      router.refresh();
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-10">
      {error ? (
        <div className="rounded-2xl border border-border bg-[#f8fafc] px-4 py-3 text-sm text-muted">
          {error}
        </div>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-medium text-foreground">{t("modQueueReports")}</h2>
          <p className="mt-1 text-sm text-muted-2">{t("modQueueReportsHint")}</p>
        </div>
        {!reports.length ? (
          <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 text-sm text-muted">
            {t("modEmptyReports")}
          </div>
        ) : (
          reports.map((r) => (
            <div
              key={r.id}
              className="rounded-3xl border border-border bg-[#f8fafc] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {r.job_title ?? r.job_post_id}
                  </div>
                  <div className="mt-1 text-xs text-muted-2">
                    {r.employer_name ?? "—"} ·{" "}
                    <Link
                      href={`/tood/${r.job_post_id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {t("reportsOpenJob")}
                    </Link>
                    {" · "}
                    {["open", "reviewing", "resolved", "dismissed"].includes(r.status)
                      ? t(`reportStatus.${r.status as "open"}`)
                      : r.status}
                  </div>
                </div>
                <div className="text-xs tabular-nums text-muted-2">
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <div className="mt-3 text-sm text-foreground/80">
                <span className="text-muted-2">{t("colReason")}: </span>
                {isJobPostReportReason(r.reason)
                  ? t(`reportReason.${r.reason as JobPostReportReason}`)
                  : r.reason}
              </div>
              {(r.details ?? "").trim() ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-body">
                  {r.details}
                </p>
              ) : null}
              <ActionButtons
                queue="reports"
                targetId={r.id}
                actions={REPORT_ACTIONS}
                busyKey={busyKey}
                onAction={runAction}
                labels={labels}
              />
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-medium text-foreground">{t("modQueueCertificates")}</h2>
          <p className="mt-1 text-sm text-muted-2">{t("modQueueCertificatesHint")}</p>
        </div>
        {!certificates.length ? (
          <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 text-sm text-muted">
            {t("modEmptyCertificates")}
          </div>
        ) : (
          certificates.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl border border-border bg-[#f8fafc] p-4 sm:p-5"
            >
              <CertificateStatusBlock
                name={(c.certificate_name ?? "").trim() || "—"}
                fields={{
                  verification_status: parseCertificateVerificationStatus(c.verification_status),
                  verified_at: null,
                  verification_source: null,
                  certificate_valid_until: null,
                  certificate_issuer: c.certificate_issuer ?? null,
                }}
                labels={certificateViewLabelsFromT((key, values) => tOnb(key, values))}
                locale={locale}
              />
              <div className="mt-1 text-xs text-muted-2">
                {[
                  (c.certificate_issuer ?? "").trim(),
                  c.owner_email,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              <ActionButtons
                queue="certificates"
                targetId={c.id}
                actions={CERT_ACTIONS}
                busyKey={busyKey}
                onAction={runAction}
                labels={labels}
              />
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-medium text-foreground">{t("modQueueCompanies")}</h2>
          <p className="mt-1 text-sm text-muted-2">{t("modQueueCompaniesHint")}</p>
        </div>
        {!companies.length ? (
          <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 text-sm text-muted">
            {t("modEmptyCompanies")}
          </div>
        ) : (
          companies.map((e) => (
            <div
              key={e.id}
              className="rounded-3xl border border-border bg-[#f8fafc] p-4 sm:p-5"
            >
              <div className="text-sm font-medium text-foreground">
                {(e.company_name ?? "").trim() || "—"}
              </div>
              <div className="mt-2">
                <CompanyVerificationBadge
                  status={parseEmployerCompanyVerificationStatus(e.verification_status)}
                  statusLine={t(
                    `companyVerificationStatus.${parseEmployerCompanyVerificationStatus(e.verification_status)}`,
                  )}
                />
              </div>
              <div className="mt-1 text-xs text-muted-2">
                {(e.registry_code ?? "").toString().trim() || "—"}
                {e.contact_email ? ` · ${e.contact_email}` : ""}
              </div>
              <ActionButtons
                queue="companies"
                targetId={e.id}
                actions={COMPANY_ACTIONS}
                busyKey={busyKey}
                onAction={runAction}
                labels={labels}
              />
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-medium text-foreground">{t("modQueueBlocked")}</h2>
          <p className="mt-1 text-sm text-muted-2">{t("modQueueBlockedHint")}</p>
        </div>
        {!blockedUsers.length ? (
          <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 text-sm text-muted">
            {t("modEmptyBlocked")}
          </div>
        ) : (
          blockedUsers.map((u) => (
            <div
              key={u.id}
              className="rounded-3xl border border-border bg-[#f8fafc] p-4 sm:p-5"
            >
              <div className="text-sm font-medium text-foreground">{u.email ?? u.id}</div>
              <div className="mt-1 text-xs text-muted-2">
                {u.role ?? "—"}
                {u.created_at ? ` · ${u.created_at.slice(0, 10)}` : ""}
              </div>
              <ActionButtons
                queue="blocked_users"
                targetId={u.id}
                actions={BLOCKED_ACTIONS}
                busyKey={busyKey}
                onAction={runAction}
                labels={labels}
              />
            </div>
          ))
        )}
      </section>
    </div>
  );
}
