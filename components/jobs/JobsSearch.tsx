"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import type { Job } from "@/components/jobs/mock-data";
import { Chip } from "@/components/ui/chip";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { JobCard } from "./JobCard";

const QUICK_CHIPS = ["Tallinn", "Tartu", "A-pädevus", "TypeScript", "Vahetused"] as const;

const FACETS = [
  { key: "sertifikaat", values: ["A-pädevus", "Kutsetunnistus", "Tõstukiluba", "Tööohutus"] },
  { key: "asukoht", values: ["Tallinn", "Tartu", "Harjumaa", "Pärnu", "Ida‑Virumaa"] },
  { key: "tüüp", values: ["Täistööaeg", "Osaline", "Vahetused", "Projekt"] },
] as const;

function matchesJob(job: Job, q: string, selected: Set<string>) {
  const hay = `${job.title} ${job.company} ${job.location} ${job.tags.join(" ")} ${job.requiredCerts.join(" ")}`.toLowerCase();
  const queryOk = q.trim().length === 0 || hay.includes(q.trim().toLowerCase());

  if (!queryOk) return false;
  if (selected.size === 0) return true;

  for (const s of selected) {
    const ok =
      job.location === s ||
      job.type === (s as Job["type"]) ||
      job.tags.includes(s) ||
      job.requiredCerts.includes(s);
    if (!ok) return false;
  }
  return true;
}

export function JobsSearch({ jobs }: { jobs: Job[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(["Tallinn"]));

  const results = useMemo(() => {
    return jobs.filter((j) => matchesJob(j, query, selected)).sort((a, b) => b.matchPercent - a.matchPercent);
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
                <div className="text-sm font-medium text-white/85">Filtrid</div>
                <div className="flex items-center gap-2 text-xs text-white/45">
                  <SlidersHorizontal className="h-4 w-4" />
                  kvaliteet
                </div>
              </div>

              <div className="mt-5">
                <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
                  Kiirvalikud
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_CHIPS.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      selected={selected.has(c)}
                      onClick={() => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(c)) next.delete(c);
                          else next.add(c);
                          return next;
                        });
                      }}
                      tone={c === "A-pädevus" ? "pink" : "default"}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-7 space-y-6">
                {FACETS.map((f) => (
                  <div key={f.key}>
                    <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
                      {f.key}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {f.values.map((v) => (
                        <Chip
                          key={v}
                          label={v}
                          selected={selected.has(v)}
                          onClick={() => {
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (next.has(v)) next.delete(v);
                              else next.add(v);
                              return next;
                            });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selected.size ? (
                <div className="mt-7 border-t border-white/[0.08] pt-5">
                  <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
                    Aktiivsed
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
                        tone={s === "A-pädevus" ? "pink" : "violet"}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-4 text-xs text-white/50 hover:text-white/75"
                    onClick={() => setSelected(new Set())}
                  >
                    Tühjenda kõik
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
                  <div className="text-sm font-medium text-white/85">Tööotsing</div>
                  <div className="mt-1 text-xs text-white/50">
                    Tulemused on järjestatud sobivuse järgi.
                  </div>
                </div>
                <div className="relative w-full sm:max-w-md">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Otsi ametit, ettevõtet, oskust…"
                    className="pl-11"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-white/50">
              <div>
                Leitud: <span className="text-white/75">{results.length}</span>
              </div>
              <div className={cn("hidden sm:block", results.length ? "" : "opacity-0")}>
                Sobivus on “signal-first”.
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {results.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {results.length === 0 ? (
              <div className="mt-10 rounded-3xl border border-white/[0.10] bg-white/[0.03] p-10 text-center text-white/65">
                Midagi ei sobitunud nende filtritega. Proovi eemaldada mõni filter.
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}

