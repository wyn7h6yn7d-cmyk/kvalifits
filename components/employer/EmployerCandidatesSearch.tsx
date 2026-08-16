"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal } from "lucide-react";

import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import {
  activeFilterCount,
  buildCandidateFacetOptions,
  candidateMatchesFilters,
  emptyCandidateFilterState,
  toggleFilterValue,
  type CandidateFilterState,
  type DiscoverableCandidate,
} from "@/lib/employer/candidateFilters";

type Props = {
  candidates: DiscoverableCandidate[];
  certificateLabel: string;
  validUntilLabel: string;
};

function formatIsoDate(iso: string) {
  const s = iso.trim();
  return s.length >= 10 ? s.slice(0, 10) : s;
}

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

export function EmployerCandidatesSearch({ candidates, certificateLabel, validUntilLabel }: Props) {
  const t = useTranslations("employerCandidates");
  const [filters, setFilters] = useState<CandidateFilterState>(() => emptyCandidateFilterState());
  const deferredQuery = useDeferredValue(filters.query);

  const facets = useMemo(() => buildCandidateFacetOptions(candidates), [candidates]);

  const deferredFilters = useMemo(
    () => ({ ...filters, query: deferredQuery }),
    [filters, deferredQuery]
  );

  const results = useMemo(
    () => candidates.filter((c) => candidateMatchesFilters(c, deferredFilters)),
    [candidates, deferredFilters]
  );

  const activeCount = activeFilterCount(filters);

  function patch(partial: Partial<CandidateFilterState>) {
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  function toggleBool(key: keyof CandidateFilterState) {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function clearAll() {
    setFilters(emptyCandidateFilterState());
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 backdrop-blur-md sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-[15px] font-medium text-white/88">{t("searchTitle")}</div>
            <div className="mt-1.5 text-sm leading-snug text-white/55">{t("searchSubtitle")}</div>
            <p className="mt-2.5 text-sm text-white/58" aria-live="polite">
              <span className="text-white/75">{t("foundCount", { count: results.length })}</span>
              {activeCount > 0 ? (
                <span className="text-white/45"> · {t("activeCount", { count: activeCount })}</span>
              ) : null}
            </p>
          </div>
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <Input
              value={filters.query}
              onChange={(e) => patch({ query: e.target.value })}
              placeholder={t("searchPlaceholder")}
              className="pl-11"
            />
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-white/45">{t("privacyNote")}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-start lg:gap-9">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-white/[0.11] bg-gradient-to-b from-violet-950/[0.38] via-black/[0.46] to-black/[0.30] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ring-1 ring-violet-400/20 backdrop-blur-md sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.10] pb-4">
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
                  onToggle={(v) => setFilters((prev) => toggleFilterValue(prev, "locations", v))}
                  emptyHint={t("facetEmpty")}
                />
                <FacetGroup
                  title={t("languages")}
                  values={facets.languages}
                  selected={filters.languages}
                  onToggle={(v) => setFilters((prev) => toggleFilterValue(prev, "languages", v))}
                />
                <FacetGroup
                  title={t("certificates")}
                  values={facets.certificates}
                  selected={filters.certificates}
                  onToggle={(v) => setFilters((prev) => toggleFilterValue(prev, "certificates", v))}
                  emptyHint={t("facetEmpty")}
                />
                <FacetGroup
                  title={t("skills")}
                  values={facets.skills}
                  selected={filters.skills}
                  onToggle={(v) => setFilters((prev) => toggleFilterValue(prev, "skills", v))}
                  emptyHint={t("facetEmpty")}
                />
                <FacetGroup
                  title={t("availability")}
                  values={facets.availability}
                  selected={filters.availability}
                  onToggle={(v) => setFilters((prev) => toggleFilterValue(prev, "availability", v))}
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

        <div className="space-y-3">
          {results.map((c) => {
            const certCount = c.certificates.length;
            const latestValid = c.certificates
              .map((x) => x.validUntil)
              .filter((x): x is string => Boolean(x))
              .sort((a, b) => b.localeCompare(a))[0];

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

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-1 text-xs text-white/70">
                    {certCount >= 1 || c.hasBLicense ? certificateLabel : "—"}
                    {certCount > 1 ? ` +${certCount - 1}` : ""}
                  </span>
                  {latestValid ? (
                    <span className="rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-1 text-xs text-white/60">
                      {validUntilLabel} {formatIsoDate(latestValid)}
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

          {!results.length ? (
            <div className="rounded-3xl border border-white/[0.12] bg-white/[0.04] p-8 text-center text-sm leading-relaxed text-white/68">
              {candidates.length ? t("noResults") : t("noCandidates")}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
