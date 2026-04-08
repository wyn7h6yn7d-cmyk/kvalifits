"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal } from "lucide-react";

import type { Job } from "@/components/jobs/mock-data";
import {
  chipMatchesJob,
  FACET_GROUPS,
  popularProfileChips,
  QUICK_CHIPS,
} from "@/components/jobs/job-filters-config";
import { Chip } from "@/components/ui/chip";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { JobCard } from "./JobCard";

const CERT_HIGHLIGHT = new Set([
  "A-pädevus",
  "B-pädevus",
  "Kutsetunnistus",
  "Kutse tase 4",
  "Tõstukiluba",
  "Tööohutus",
]);

const popularProfileSet = new Set(popularProfileChips as readonly string[]);

function chipTone(label: string): "pink" | "violet" | "default" {
  if (CERT_HIGHLIGHT.has(label)) return "pink";
  if (popularProfileSet.has(label)) return "violet";
  return "default";
}

function matchesJob(job: Job, q: string, selected: Set<string>) {
  const hay = [
    job.title,
    job.company,
    job.location,
    job.tags.join(" "),
    job.requiredCerts.join(" "),
    (job.domains ?? []).join(" "),
    (job.languages ?? []).join(" "),
  ]
    .join(" ")
    .toLowerCase();
  const queryOk = q.trim().length === 0 || hay.includes(q.trim().toLowerCase());

  if (!queryOk) return false;
  if (selected.size === 0) return true;

  for (const s of selected) {
    if (!chipMatchesJob(job, s)) return false;
  }
  return true;
}

function toggleChip(setSelected: Dispatch<SetStateAction<Set<string>>>, c: string) {
  setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    return next;
  });
}

export function JobsSearch({ jobs }: { jobs: Job[] }) {
  const t = useTranslations("jobsSearch");
  const tf = useTranslations("jobsFacets");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(["Tallinn"]));

  const results = useMemo(() => {
    return jobs
      .filter((j) => matchesJob(j, query, selected))
      .sort((a, b) => b.matchPercent - a.matchPercent);
  }, [jobs, query, selected]);

  const selectedArr = Array.from(selected);

  return (
    <section className="py-14 sm:py-16">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          {/* Sidebar filters */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white/85">{t("filters")}</div>
                <div className="flex items-center gap-2 text-xs text-white/45">
                  <SlidersHorizontal className="h-4 w-4" />
                  {t("quality")}
                </div>
              </div>

              <div className="mt-5">
                <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
                  {t("quick")}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_CHIPS.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      selected={selected.has(c)}
                      onClick={() => toggleChip(setSelected, c)}
                      tone={chipTone(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-7">
                <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
                  {t("profileSignals")}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-white/40">
                  {t("profileSignalsHint", { count: popularProfileChips.length })}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {popularProfileChips.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      selected={selected.has(c)}
                      onClick={() => toggleChip(setSelected, c)}
                      tone="violet"
                    />
                  ))}
                </div>
              </div>

              <div className="mt-7 space-y-6">
                {FACET_GROUPS.map((f) => (
                  <div key={f.id}>
                    <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
                      {tf(f.id as "sertifikaat" | "valdkond" | "keel" | "asukoht" | "tyyp")}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {f.values.map((v) => (
                        <Chip
                          key={v}
                          label={v}
                          selected={selected.has(v)}
                          onClick={() => toggleChip(setSelected, v)}
                          tone={chipTone(v)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selected.size ? (
                <div className="mt-7 border-t border-white/[0.08] pt-5">
                  <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
                    {t("active")}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedArr.map((s) => (
                      <Chip
                        key={s}
                        label={s}
                        selected
                        onRemove={() => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            next.delete(s);
                            return next;
                          });
                        }}
                        tone={chipTone(s)}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-4 text-xs text-white/50 hover:text-white/75"
                    onClick={() => setSelected(new Set())}
                  >
                    {t("clearAll")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Results */}
          <div>
            <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 backdrop-blur-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-white/85">{t("searchTitle")}</div>
                  <div className="mt-1 text-xs text-white/50">{t("searchSubtitle")}</div>
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
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-white/50">
              <div>
                {t("found")} <span className="text-white/75">{results.length}</span>
              </div>
              <div className={cn("hidden sm:block", results.length ? "" : "opacity-0")}>
                {t("signalFirst")}
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {results.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {results.length === 0 ? (
              <div className="mt-10 rounded-3xl border border-white/[0.10] bg-white/[0.03] p-10 text-center text-white/65">
                {t("noResults")}
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
