"use client";

import { useMemo, useState } from "react";
import { Filter, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/routing";
import {
  APPLICATION_PIPELINE_STATUSES,
  formatPipelineTimestamp,
  normalizeApplicationStatus,
  type ApplicationPipelineStatus,
} from "@/lib/employer/applicationPipeline";
import { EmployerApplicationStatusSelect } from "@/components/employer/EmployerApplicationStatusSelect";
import { EmployerApplicantDetailDrawer } from "@/components/employer/EmployerApplicantDetailDrawer";
import {
  formatAvailabilityStartDisplay,
  formatSalaryExpectationScan,
} from "@/lib/jobs/applicationAnswers";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  type ApplicantApplicationRow,
  type ApplicantInboxJobOption,
  applicantInitials,
  scanApplicantRow,
  uniqueCertificateNames,
} from "@/lib/employer/applicantScan";

type SortKey = "match" | "newest" | "available" | "salary";
type StartFilter = "all" | "immediate" | "soon" | "month" | "date" | "agreement";
type ExpFilter = "all" | "first_job" | "entry" | "mid" | "senior" | "lead" | "executive" | "years_2" | "years_5";
type SalaryCap = "all" | "negotiable" | "1500" | "2000" | "2500" | "3000" | "4000";

const filterSelectClass =
  "h-9 w-full rounded-lg border border-border bg-[#f8fafc] px-2.5 text-[12px] text-foreground/80 outline-none focus:border-[rgba(37,99,235,0.35)]";

function matchesStartFilter(start: string | undefined, filter: StartFilter): boolean {
  if (filter === "all") return true;
  if (!start) return false;
  if (filter === "immediate") return start === "immediate";
  if (filter === "soon") return start === "immediate" || start === "within_1_week" || start === "within_2_weeks";
  if (filter === "month") {
    return (
      start === "immediate" ||
      start === "within_1_week" ||
      start === "within_2_weeks" ||
      start === "within_1_month"
    );
  }
  if (filter === "date") return start === "specific_date";
  return start === "by_agreement";
}

function matchesExperience(scan: ReturnType<typeof scanApplicantRow>, filter: ExpFilter): boolean {
  if (filter === "all") return true;
  if (filter === "first_job") return scan.firstJob;
  if (filter === "years_2") return scan.years !== null && scan.years >= 2;
  if (filter === "years_5") return scan.years !== null && scan.years >= 5;
  return scan.experienceLevel === filter;
}

function matchesSalary(scan: ReturnType<typeof scanApplicantRow>, filter: SalaryCap): boolean {
  if (filter === "all") return true;
  if (filter === "negotiable") return scan.answers?.salaryMode === "negotiable";
  const cap = Number(filter);
  if (scan.answers?.salaryMode === "negotiable") return true;
  if (scan.salaryMonthly === null) return false;
  return scan.salaryMonthly <= cap;
}

export function EmployerApplicantList({
  locale,
  jobPostId,
  applications,
  jobs = [],
}: {
  locale: string;
  jobPostId: string;
  applications: ApplicantApplicationRow[];
  jobs?: ApplicantInboxJobOption[];
}) {
  const t = useTranslations("jobs");
  const router = useRouter();

  const [filterStatus, setFilterStatus] = useState<ApplicationPipelineStatus | "all">("all");
  const [minMatch, setMinMatch] = useState(0);
  const [salaryCap, setSalaryCap] = useState<SalaryCap>("all");
  const [startFilter, setStartFilter] = useState<StartFilter>("all");
  const [certFilter, setCertFilter] = useState("all");
  const [expFilter, setExpFilter] = useState<ExpFilter>("all");
  const [sort, setSort] = useState<SortKey>("match");
  const [openId, setOpenId] = useState<string | null>(null);

  const [statusById, setStatusById] = useState<Record<string, ApplicationPipelineStatus>>(() => {
    const init: Record<string, ApplicationPipelineStatus> = {};
    for (const a of applications) {
      init[a.id] = normalizeApplicationStatus(a.status);
    }
    return init;
  });
  const [statusUpdatedAtById, setStatusUpdatedAtById] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    for (const a of applications) {
      init[a.id] = a.status_updated_at ?? a.created_at ?? null;
    }
    return init;
  });

  function onRowStatusUpdated(id: string, next: ApplicationPipelineStatus, at?: string | null) {
    setStatusById((prev) => ({ ...prev, [id]: next }));
    setStatusUpdatedAtById((prev) => ({ ...prev, [id]: at ?? new Date().toISOString() }));
  }

  const certOptions = useMemo(() => uniqueCertificateNames(applications), [applications]);

  const filtered = useMemo(() => {
    const list = applications.filter((a) => {
      const scan = scanApplicantRow(a);
      const s = statusById[a.id] ?? normalizeApplicationStatus(a.status);
      if (filterStatus !== "all" && s !== filterStatus) return false;
      if (minMatch > 0 && (scan.score ?? -1) < minMatch) return false;
      if (!matchesSalary(scan, salaryCap)) return false;
      if (!matchesStartFilter(scan.answers?.availability_start, startFilter)) return false;
      if (certFilter !== "all") {
        const needle = certFilter.toLowerCase();
        if (!scan.certNamesAll.some((n) => n.toLowerCase() === needle)) return false;
      }
      if (!matchesExperience(scan, expFilter)) return false;
      return true;
    });

    list.sort((a, b) => {
      const sa = scanApplicantRow(a);
      const sb = scanApplicantRow(b);
      if (sort === "newest") return sb.appliedAtMs - sa.appliedAtMs;
      if (sort === "available") return sa.startSort - sb.startSort;
      if (sort === "salary") return sa.salarySort - sb.salarySort;
      const ma = sa.score ?? -1;
      const mb = sb.score ?? -1;
      return mb - ma;
    });
    return list;
  }, [applications, filterStatus, minMatch, salaryCap, startFilter, certFilter, expFilter, sort, statusById]);

  const openRow = openId ? applications.find((a) => a.id === openId) ?? null : null;
  const currentJob = jobs.find((j) => j.id === jobPostId);
  const headlineCount = currentJob?.applicantCount ?? applications.length;

  function onJobChange(nextId: string) {
    if (!nextId || nextId === jobPostId) return;
    router.push(`/account/employer/jobs/${nextId}/applicants`);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-white p-4 sm:p-5">
        <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-2" htmlFor="inbox-job">
          {t("inboxSelectJob")}
        </label>
        {jobs.length ? (
          <select
            id="inbox-job"
            value={jobPostId}
            onChange={(e) => onJobChange(e.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-[#f8fafc] px-3 text-sm font-medium text-foreground outline-none focus:border-[rgba(37,99,235,0.35)]"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id} className="bg-white text-foreground">
                {t("inboxJobOption", { title: j.title, count: j.applicantCount })}
              </option>
            ))}
          </select>
        ) : (
          <div className="mt-2 text-base font-semibold text-foreground">
            {t("inboxJobOption", {
              title: currentJob?.title ?? t("applicantsForJob"),
              count: headlineCount,
            })}
          </div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-2">
            {t("inboxFilterMinMatch")}
          </span>
          <select className={filterSelectClass} value={minMatch} onChange={(e) => setMinMatch(Number(e.target.value))}>
            <option value={0} className="bg-white">
              {t("inboxFilterAny")}
            </option>
            <option value={50} className="bg-white">
              50%
            </option>
            <option value={70} className="bg-white">
              70%
            </option>
            <option value={80} className="bg-white">
              80%
            </option>
            <option value={90} className="bg-white">
              90%
            </option>
          </select>
        </label>
        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-2">
            {t("inboxFilterStatus")}
          </span>
          <select
            className={filterSelectClass}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ApplicationPipelineStatus | "all")}
          >
            <option value="all" className="bg-white">
              {t("applicationPipelineAll")}
            </option>
            {APPLICATION_PIPELINE_STATUSES.map((s) => (
              <option key={s} value={s} className="bg-white">
                {t(`applicationPipelineStatus.${s}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-2">
            {t("inboxFilterSalary")}
          </span>
          <select
            className={filterSelectClass}
            value={salaryCap}
            onChange={(e) => setSalaryCap(e.target.value as SalaryCap)}
          >
            <option value="all" className="bg-white">
              {t("inboxFilterAny")}
            </option>
            <option value="negotiable" className="bg-white">
              {t("applySalaryModeOption.negotiable")}
            </option>
            <option value="1500" className="bg-white">
              {t("inboxSalaryUpTo", { amount: 1500 })}
            </option>
            <option value="2000" className="bg-white">
              {t("inboxSalaryUpTo", { amount: 2000 })}
            </option>
            <option value="2500" className="bg-white">
              {t("inboxSalaryUpTo", { amount: 2500 })}
            </option>
            <option value="3000" className="bg-white">
              {t("inboxSalaryUpTo", { amount: 3000 })}
            </option>
            <option value="4000" className="bg-white">
              {t("inboxSalaryUpTo", { amount: 4000 })}
            </option>
          </select>
        </label>
        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-2">
            {t("inboxFilterStart")}
          </span>
          <select
            className={filterSelectClass}
            value={startFilter}
            onChange={(e) => setStartFilter(e.target.value as StartFilter)}
          >
            <option value="all" className="bg-white">
              {t("inboxFilterAny")}
            </option>
            <option value="immediate" className="bg-white">
              {t("applyAvailableFromOption.immediate")}
            </option>
            <option value="soon" className="bg-white">
              {t("inboxStartSoon")}
            </option>
            <option value="month" className="bg-white">
              {t("inboxStartMonth")}
            </option>
            <option value="date" className="bg-white">
              {t("applyAvailableFromOption.specific_date")}
            </option>
            <option value="agreement" className="bg-white">
              {t("applyAvailableFromOption.by_agreement")}
            </option>
          </select>
        </label>
        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-2">
            {t("inboxFilterCertificate")}
          </span>
          <select className={filterSelectClass} value={certFilter} onChange={(e) => setCertFilter(e.target.value)}>
            <option value="all" className="bg-white">
              {t("inboxFilterAny")}
            </option>
            {certOptions.map((name) => (
              <option key={name} value={name} className="bg-white">
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-2">
            {t("inboxFilterExperience")}
          </span>
          <select
            className={filterSelectClass}
            value={expFilter}
            onChange={(e) => setExpFilter(e.target.value as ExpFilter)}
          >
            <option value="all" className="bg-white">
              {t("inboxFilterAny")}
            </option>
            <option value="first_job" className="bg-white">
              {t("applicantCardFirstJob")}
            </option>
            <option value="entry" className="bg-white">
              {t("inboxExpEntry")}
            </option>
            <option value="mid" className="bg-white">
              {t("inboxExpMid")}
            </option>
            <option value="senior" className="bg-white">
              {t("inboxExpSenior")}
            </option>
            <option value="years_2" className="bg-white">
              {t("inboxExpYears", { years: 2 })}
            </option>
            <option value="years_5" className="bg-white">
              {t("inboxExpYears", { years: 5 })}
            </option>
          </select>
        </label>
        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-2">
            {t("inboxSort")}
          </span>
          <select className={filterSelectClass} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="match" className="bg-white">
              {t("inboxSortMatch")}
            </option>
            <option value="newest" className="bg-white">
              {t("inboxSortNewest")}
            </option>
            <option value="available" className="bg-white">
              {t("inboxSortAvailable")}
            </option>
            <option value="salary" className="bg-white">
              {t("inboxSortSalary")}
            </option>
          </select>
        </label>
      </div>

      {!applications.length ? (
        <EmptyState icon={Users} title={t("noApplicationsYet")} />
      ) : !filtered.length ? (
        <EmptyState icon={Filter} title={t("applicationPipelineEmptyFilter")} className="py-8" />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-border lg:block">
            <table className="w-full min-w-[72rem] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-[10px] font-medium uppercase tracking-[0.1em] text-muted-2">
                  <th className="px-4 py-3 font-medium">{t("inboxColCandidate")}</th>
                  <th className="px-3 py-3 font-medium">{t("inboxColTitle")}</th>
                  <th className="px-3 py-3 font-medium">{t("inboxColMatch")}</th>
                  <th className="px-3 py-3 font-medium">{t("inboxColRequirements")}</th>
                  <th className="px-3 py-3 font-medium">{t("inboxColSalary")}</th>
                  <th className="px-3 py-3 font-medium">{t("inboxColStart")}</th>
                  <th className="px-3 py-3 font-medium">{t("inboxColWorkload")}</th>
                  <th className="px-3 py-3 font-medium">{t("inboxColApplied")}</th>
                  <th className="px-3 py-3 font-medium">{t("inboxColStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <ApplicantTableRow
                    key={a.id}
                    locale={locale}
                    row={a}
                    status={statusById[a.id] ?? normalizeApplicationStatus(a.status)}
                    selected={openId === a.id}
                    onOpen={() => setOpenId(a.id)}
                    onStatusUpdated={(next, at) => onRowStatusUpdated(a.id, next, at)}
                    statusUpdatedAt={statusUpdatedAtById[a.id] ?? a.status_updated_at ?? a.created_at}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <ul className="list-none space-y-2 p-0 lg:hidden">
            {filtered.map((a) => (
              <ApplicantMobileRow
                key={a.id}
                locale={locale}
                row={a}
                status={statusById[a.id] ?? normalizeApplicationStatus(a.status)}
                selected={openId === a.id}
                onOpen={() => setOpenId(a.id)}
                onStatusUpdated={(next, at) => onRowStatusUpdated(a.id, next, at)}
                statusUpdatedAt={statusUpdatedAtById[a.id] ?? a.status_updated_at ?? a.created_at}
              />
            ))}
          </ul>
        </>
      )}

      <EmployerApplicantDetailDrawer
        locale={locale}
        jobPostId={jobPostId}
        row={openRow}
        status={openRow ? statusById[openRow.id] ?? normalizeApplicationStatus(openRow.status) : "new"}
        statusUpdatedAt={
          openRow
            ? statusUpdatedAtById[openRow.id] ?? openRow.status_updated_at ?? openRow.created_at
            : null
        }
        onStatusUpdated={(next, at) => {
          if (!openRow) return;
          onRowStatusUpdated(openRow.id, next, at);
        }}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}

function ApplicantTableRow({
  locale,
  row,
  status,
  statusUpdatedAt,
  selected,
  onOpen,
  onStatusUpdated,
}: {
  locale: string;
  row: ApplicantApplicationRow;
  status: ApplicationPipelineStatus;
  statusUpdatedAt: string | null | undefined;
  selected: boolean;
  onOpen: () => void;
  onStatusUpdated: (next: ApplicationPipelineStatus, at?: string | null) => void;
}) {
  const t = useTranslations("jobs");
  const scan = scanApplicantRow(row);
  const salaryScan = scan.answers
    ? formatSalaryExpectationScan(scan.answers, {
        negotiable: t("applySalaryModeOption.negotiable"),
        brutoMonthly: t("applySalaryBasisOption.bruto_monthly"),
        brutoHourly: t("applySalaryBasisOption.bruto_hourly"),
      })
    : null;
  const startLabel = scan.answers
    ? formatAvailabilityStartDisplay(scan.answers, (code) => t(`applyAvailableFromOption.${code}`))
    : null;
  const applied = formatApplied(locale, row.created_at);
  const req =
    scan.reqTotal > 0
      ? t("applicantCardRequirementsFilled", { matched: scan.reqMatched, total: scan.reqTotal })
      : t("applicantCardRequirementsUnknown");

  return (
    <tr
      className={cn(
        "cursor-pointer border-b border-border text-foreground/80 transition-colors hover:bg-[#f5f7fb]",
        selected && "bg-[#f8fafc]",
      )}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      tabIndex={0}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={scan.name} url={scan.avatarUrl} />
          <span className="font-medium text-foreground">{scan.name}</span>
        </div>
      </td>
      <td className="max-w-[12rem] truncate px-3 py-3 text-body">{scan.profileTitle || "—"}</td>
      <td className="px-3 py-3 tabular-nums font-medium text-foreground">
                {scan.score == null ? "—" : `${scan.score}%`}
      </td>
      <td className="px-3 py-3 tabular-nums">{req}</td>
      <td className="px-3 py-3">
        {salaryScan ? (
          <span className="tabular-nums">
            {salaryScan.primary}
            <span className="ml-1 text-[11px] text-muted-2">{salaryScan.basis}</span>
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-3">{startLabel ?? "—"}</td>
      <td className="px-3 py-3 tabular-nums">
        {scan.weeklyHours != null ? t("applicantCardHoursPerWeek", { hours: scan.weeklyHours }) : "—"}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-muted">{applied}</td>
      <td className="min-w-[9.5rem] px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <EmployerApplicationStatusSelect applicationId={row.id} status={status} compact onUpdated={onStatusUpdated} />
        <div className="mt-1 text-[10px] tabular-nums text-muted-2">
          {t("applicationStatusUpdatedAt")}: {formatPipelineTimestamp(locale, statusUpdatedAt)}
        </div>
      </td>
    </tr>
  );
}

function ApplicantMobileRow({
  locale,
  row,
  status,
  statusUpdatedAt,
  selected,
  onOpen,
  onStatusUpdated,
}: {
  locale: string;
  row: ApplicantApplicationRow;
  status: ApplicationPipelineStatus;
  statusUpdatedAt: string | null | undefined;
  selected: boolean;
  onOpen: () => void;
  onStatusUpdated: (next: ApplicationPipelineStatus, at?: string | null) => void;
}) {
  const t = useTranslations("jobs");
  const scan = scanApplicantRow(row);
  const salaryScan = scan.answers
    ? formatSalaryExpectationScan(scan.answers, {
        negotiable: t("applySalaryModeOption.negotiable"),
        brutoMonthly: t("applySalaryBasisOption.bruto_monthly"),
        brutoHourly: t("applySalaryBasisOption.bruto_hourly"),
      })
    : null;
  const startLabel = scan.answers
    ? formatAvailabilityStartDisplay(scan.answers, (code) => t(`applyAvailableFromOption.${code}`))
    : null;
  const req =
    scan.reqTotal > 0
      ? t("applicantCardRequirementsFilled", { matched: scan.reqMatched, total: scan.reqTotal })
      : t("applicantCardRequirementsUnknown");

  return (
    <li>
      <div
        className={cn(
          "rounded-2xl border border-border bg-white p-4",
          selected && "border-border-strong bg-[#f8fafc]",
        )}
      >
        <button type="button" onClick={onOpen} className="min-h-11 w-full text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar name={scan.name} url={scan.avatarUrl} />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{scan.name}</div>
                <div className="truncate text-xs text-muted-2">{scan.profileTitle || "—"}</div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-medium tabular-nums text-foreground">
                {scan.score == null ? "—" : `${scan.score}%`}
              </div>
              <div className="text-[11px] tabular-nums text-muted-2">{req}</div>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px] text-body">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.08em] text-muted-2">{t("inboxColSalary")}</dt>
              <dd className="mt-0.5 tabular-nums">{salaryScan ? salaryScan.primary : "—"}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.08em] text-muted-2">{t("inboxColStart")}</dt>
              <dd className="mt-0.5">{startLabel ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.08em] text-muted-2">{t("inboxColWorkload")}</dt>
              <dd className="mt-0.5">
                {scan.weeklyHours != null ? t("applicantCardHoursPerWeek", { hours: scan.weeklyHours }) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.08em] text-muted-2">{t("inboxColApplied")}</dt>
              <dd className="mt-0.5">{formatApplied(locale, row.created_at)}</dd>
            </div>
          </dl>
        </button>
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          <EmployerApplicationStatusSelect applicationId={row.id} status={status} compact onUpdated={onStatusUpdated} />
          <div className="mt-1 text-[10px] tabular-nums text-muted-2">
            {t("applicationStatusUpdatedAt")}: {formatPipelineTimestamp(locale, statusUpdatedAt)}
          </div>
        </div>
      </div>
    </li>
  );
}

function Avatar({ name, url }: { name: string; url: string }) {
  return (
    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-border bg-[#f8fafc]">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-muted-2">
          {applicantInitials(name)}
        </div>
      )}
    </div>
  );
}

function formatApplied(locale: string, iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}
