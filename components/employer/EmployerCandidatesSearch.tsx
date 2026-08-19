"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search, SlidersHorizontal, Users, X } from "lucide-react";

import { parseCertificateVerificationStatus } from "@/lib/seeker/certificateVerification";
import {
  CertificateStatusBlock,
  certificateViewLabelsFromT,
} from "@/components/seeker/CertificateVerificationBadge";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import {
  activeFilterCount,
  emptyCandidateFilterState,
  toggleFilterValue,
  type CandidateFacetOptions,
  type CandidateFilterState,
  type DiscoverableCandidate,
} from "@/lib/employer/candidateFilters";
import {
  buildCandidateDiscoveryUrl,
  parseCandidateDiscoveryParams,
} from "@/lib/employer/candidateDiscoveryUrl";
import { Link, useRouter } from "@/i18n/routing";

type Props = {
  candidates: DiscoverableCandidate[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  facets: CandidateFacetOptions;
  certificateLabel: string;
  validUntilLabel: string;
};

function FilterToggle({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return <Chip label={label} selected={selected} onClick={onClick} tone={selected ? "violet" : "default"} />;
}

function FacetGroup({
  title,
  values,
  selected,
  onToggle,
  emptyHint,
}: {
  title: string;
  values: string[];
  selected: string[];
  onToggle: (v: string) => void;
  emptyHint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/[0.22] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/36">{title}</div>
      {values.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((v) => (
            <Chip
              key={v}
              label={v}
              selected={selected.includes(v)}
              onClick={() => onToggle(v)}
              tone={selected.includes(v) ? "violet" : "default"}
            />
          ))}
        </div>
      ) : emptyHint ? (
        <p className="mt-2 text-sm text-white/48">{emptyHint}</p>
      ) : null}
    </div>
  );
}

export function EmployerCandidatesSearch({
  candidates,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  facets,
  certificateLabel,
}: Props) {
  const t = useTranslations("employerCandidates");
  const tOnb = useTranslations("onboarding");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramsKey = searchParams.toString();
  const parsed = parseCandidateDiscoveryParams(searchParams);
  const filters = parsed.filters;
  const [query, setQuery] = useState(filters.query);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setQuery(parseCandidateDiscoveryParams(searchParams).filters.query);
  }, [paramsKey, searchParams]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const current = parseCandidateDiscoveryParams(searchParams).filters;
      if (current.query === query) return;
      router.replace(buildCandidateDiscoveryUrl({ filters: { ...current, query }, page: 1 }), {
        scroll: false,
      });
    }, 180);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce query into the URL for server search
  }, [query, paramsKey]);

  const activeCount = activeFilterCount({ ...filters, query });

  function commit(next: CandidateFilterState, page = 1) {
    router.replace(buildCandidateDiscoveryUrl({ filters: next, page }), { scroll: false });
  }

  function patch(partial: Partial<CandidateFilterState>) {
    commit({ ...filters, query, ...partial });
  }

  function toggleBool(key: keyof CandidateFilterState) {
    const current = filters[key];
    if (typeof current !== "boolean") return;
    commit({ ...filters, query, [key]: !current });
  }

  function clearAll() {
    setQuery("");
    commit(emptyCandidateFilterState());
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-[15px] font-medium text-white/88">{t("searchTitle")}</div>
            <div className="mt-1.5 text-sm leading-snug text-white/55">{t("searchSubtitle")}</div>
            <p className="mt-2.5 text-sm text-white/58" aria-live="polite">
              <span className="text-white/75">{t("foundCount", { count: totalCount })}</span>
              {activeCount > 0 ? (
                <span className="text-white/45"> · {t("activeCount", { count: activeCount })}</span>
              ) : null}
            </p>
          </div>
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="pl-11"
            />
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-white/45">{t("privacyNote")}</p>
      </div>

      <div className="sticky top-[var(--site-header-offset)] z-30 -mx-1 mb-3 bg-background py-2 lg:hidden">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-between rounded-xl px-4"
          onClick={() => setMobileOpen(true)}
        >
          <span className="inline-flex items-center gap-2 text-[14px]">
            <SlidersHorizontal className="h-4 w-4 opacity-70" aria-hidden />
            {activeCount ? t("filtersWithCount", { count: activeCount }) : t("filters")}
          </span>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-start lg:gap-9">
        <div
          className={cn(
            mobileOpen
              ? "fixed inset-0 z-[90] flex flex-col bg-[#121214] lg:static lg:z-auto lg:block lg:bg-transparent"
              : "hidden lg:sticky lg:top-24 lg:block lg:self-start",
          )}
        >
          {mobileOpen ? (
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
              <div className="text-[15px] font-medium text-white/90">
                {activeCount ? t("filtersWithCount", { count: activeCount }) : t("filters")}
              </div>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white/50 hover:bg-white/[0.05]"
                aria-label={t("closeFilters")}
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-visible">
          <div className="rounded-none border-0 bg-transparent p-4 lg:rounded-2xl lg:border lg:border-white/[0.11] lg:bg-[#141018] lg:p-5">
            <div className="hidden items-center justify-between gap-3 border-b border-white/[0.10] pb-4 lg:flex">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/44">
                {t("filters")}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/36">
                <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                {t("practicalFit")}
              </div>
            </div>

            <div className="mt-5 space-y-6">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/36">
                  {t("groupExperience")}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <FilterToggle
                    label={t("seekingFirstJob")}
                    selected={filters.seekingFirstJob}
                    onClick={() => toggleBool("seekingFirstJob")}
                  />
                  <FilterToggle
                    label={t("experienceNotRequired")}
                    selected={filters.experienceNotRequired}
                    onClick={() => toggleBool("experienceNotRequired")}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium tracking-wide text-white/45" htmlFor="exp-min">
                      {t("experienceYearsMin")}
                    </label>
                    <Input
                      id="exp-min"
                      inputMode="decimal"
                      value={filters.experienceYearsMin}
                      onChange={(e) => patch({ experienceYearsMin: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium tracking-wide text-white/45" htmlFor="exp-max">
                      {t("experienceYearsMax")}
                    </label>
                    <Input
                      id="exp-max"
                      inputMode="decimal"
                      value={filters.experienceYearsMax}
                      onChange={(e) => patch({ experienceYearsMax: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/36">
                  {t("groupLoad")}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <FilterToggle
                    label={t("partTime")}
                    selected={filters.partTime}
                    onClick={() => toggleBool("partTime")}
                  />
                  <FilterToggle
                    label={t("fullTime")}
                    selected={filters.fullTime}
                    onClick={() => toggleBool("fullTime")}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium tracking-wide text-white/45" htmlFor="hours-min">
                      {t("desiredHoursMin")}
                    </label>
                    <Input
                      id="hours-min"
                      inputMode="decimal"
                      value={filters.desiredHoursMin}
                      onChange={(e) => patch({ desiredHoursMin: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium tracking-wide text-white/45" htmlFor="hours-max">
                      {t("desiredHoursMax")}
                    </label>
                    <Input
                      id="hours-max"
                      inputMode="decimal"
                      value={filters.desiredHoursMax}
                      onChange={(e) => patch({ desiredHoursMax: e.target.value })}
                      placeholder="40"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-white/40">{t("desiredHoursHint")}</p>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/36">
                  {t("groupSchedule")}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <FilterToggle label={t("dayWork")} selected={filters.dayWork} onClick={() => toggleBool("dayWork")} />
                  <FilterToggle
                    label={t("eveningWork")}
                    selected={filters.eveningWork}
                    onClick={() => toggleBool("eveningWork")}
                  />
                  <FilterToggle
                    label={t("shiftWork")}
                    selected={filters.shiftWork}
                    onClick={() => toggleBool("shiftWork")}
                  />
                  <FilterToggle
                    label={t("weekendWork")}
                    selected={filters.weekendWork}
                    onClick={() => toggleBool("weekendWork")}
                  />
                  <FilterToggle
                    label={t("flexibleHours")}
                    selected={filters.flexibleHours}
                    onClick={() => toggleBool("flexibleHours")}
                  />
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/36">
                  {t("groupWorkForm")}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <FilterToggle label={t("remote")} selected={filters.remote} onClick={() => toggleBool("remote")} />
                  <FilterToggle label={t("hybrid")} selected={filters.hybrid} onClick={() => toggleBool("hybrid")} />
                  <FilterToggle label={t("onSite")} selected={filters.onSite} onClick={() => toggleBool("onSite")} />
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/36">
                  {t("groupWorkplace")}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <FilterToggle
                    label={t("accessibleWorkplace")}
                    selected={filters.accessibleWorkplace}
                    onClick={() => toggleBool("accessibleWorkplace")}
                  />
                  <FilterToggle
                    label={t("adaptedArrangement")}
                    selected={filters.adaptedArrangement}
                    onClick={() => toggleBool("adaptedArrangement")}
                  />
                  <FilterToggle
                    label={t("extraBreaks")}
                    selected={filters.extraBreaks}
                    onClick={() => toggleBool("extraBreaks")}
                  />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-white/40">{t("workplaceNeedsHint")}</p>
              </div>

              <div className="space-y-4 border-t border-white/[0.10] pt-6">
                <FacetGroup
                  title={t("location")}
                  values={facets.locations}
                  selected={filters.locations}
                  onToggle={(v) => commit(toggleFilterValue({ ...filters, query }, "locations", v))}
                  emptyHint={t("facetEmpty")}
                />
                <FacetGroup
                  title={t("languages")}
                  values={facets.languages}
                  selected={filters.languages}
                  onToggle={(v) => commit(toggleFilterValue({ ...filters, query }, "languages", v))}
                />
                <FacetGroup
                  title={t("certificates")}
                  values={facets.certificates}
                  selected={filters.certificates}
                  onToggle={(v) => commit(toggleFilterValue({ ...filters, query }, "certificates", v))}
                  emptyHint={t("facetEmpty")}
                />
                <FacetGroup
                  title={t("skills")}
                  values={facets.skills}
                  selected={filters.skills}
                  onToggle={(v) => commit(toggleFilterValue({ ...filters, query }, "skills", v))}
                  emptyHint={t("facetEmpty")}
                />
                <FacetGroup
                  title={t("availability")}
                  values={facets.availability}
                  selected={filters.availability}
                  onToggle={(v) => commit(toggleFilterValue({ ...filters, query }, "availability", v))}
                  emptyHint={t("availabilityEmpty")}
                />
              </div>

              {activeCount > 0 ? (
                <div className="border-t border-white/[0.10] pt-5">
                  <button
                    type="button"
                    className="text-sm text-white/55 transition-colors hover:text-white/80"
                    onClick={clearAll}
                  >
                    {t("clearAll")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          </div>
          {mobileOpen ? (
            <div className="border-t border-white/[0.08] space-y-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
              {activeCount > 0 ? (
                <Button type="button" variant="outline" className="h-12 w-full rounded-xl" onClick={clearAll}>
                  {t("clearAll")}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="primary"
                className="h-12 w-full rounded-xl"
                onClick={() => setMobileOpen(false)}
              >
                {t("showResults", { count: totalCount })}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          {candidates.map((c) => {
            return (
              <div key={c.id} className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white/85">{c.displayName}</div>
                    <div className="mt-1 text-xs text-white/55">
                      {(c.profileTitle || "").trim() ? c.profileTitle : c.experienceLevel}{" "}
                      {c.location ? <span className="text-white/45">·</span> : null} {c.location}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {c.certificates.slice(0, 2).map((cert, i) => (
                    <CertificateStatusBlock
                      key={`${c.id}-${cert.name}-${i}`}
                      name={cert.name}
                      fields={{
                        verification_status: parseCertificateVerificationStatus(cert.verification_status),
                        verified_at: cert.verified_at ?? null,
                        verification_source: cert.verification_source ?? null,
                        certificate_valid_until: cert.validUntil,
                        certificate_issuer: cert.issuer ?? null,
                      }}
                      labels={certificateViewLabelsFromT((key, values) => tOnb(key, values))}
                      locale={locale}
                    />
                  ))}
                  {c.certificates.length > 2 ? (
                    <div className="text-[11px] text-white/45">+{c.certificates.length - 2}</div>
                  ) : null}
                  {!c.certificates.length && c.hasBLicense ? (
                    <span className="rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-1 text-xs text-white/70">
                      {certificateLabel}
                    </span>
                  ) : null}
                  {c.seekingFirstJob ? (
                    <span className="rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-1 text-xs text-white/60">
                      {t("seekingFirstJob")}
                    </span>
                  ) : null}
                </div>

                {c.skills.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.skills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-1 text-xs text-white/70"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}

          {!candidates.length ? (
            <EmptyState
              icon={Users}
              title={activeCount ? t("noResults") : t("noCandidates")}
            />
          ) : null}

          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between gap-3">
              {currentPage > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={buildCandidateDiscoveryUrl({ filters: { ...filters, query }, page: currentPage - 1 })}>
                    {t("pagePrev")}
                  </Link>
                </Button>
              ) : (
                <span />
              )}
              <p className="text-[13px] text-white/50">
                {t("pageStatus", { page: currentPage, pages: totalPages, size: pageSize })}
              </p>
              {currentPage < totalPages ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={buildCandidateDiscoveryUrl({ filters: { ...filters, query }, page: currentPage + 1 })}>
                    {t("pageNext")}
                  </Link>
                </Button>
              ) : (
                <span />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
