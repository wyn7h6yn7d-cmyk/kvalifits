"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Briefcase,
  ClipboardList,
  Layers,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const seekerSteps = [
  { n: "01", title: "Oskused", line: "Pädevus, mida saab võrrelda." },
  { n: "02", title: "Tõendid", line: "Load ja sertifikaadid ühes profiilis." },
  { n: "03", title: "Sobivus", line: "Protsent ja põhjus — mitte oletus." },
] as const;

export function Audience() {
  return (
    <section className="relative py-20 sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent"
      />

      <Container>
        <div className="max-w-xl">
          <div className="text-xs font-medium uppercase tracking-[0.26em] text-white/45">
            Sinu roll
          </div>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.65rem]">
            Kaks rolli.
            <span className="block text-white/48"> Üks loogika.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/52 sm:text-lg">
            Pädevus ühel pool, nõuded teisel — sama tõlgendus.
          </p>
        </div>

        <div className="mt-16 grid gap-14 lg:mt-20 lg:grid-cols-12 lg:items-start lg:gap-8 xl:gap-12">
          {/* Tööotsija — vertikaalne voog, profiili keskne */}
          <motion.div
            id="toootsijatele"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="scroll-mt-28 lg:col-span-7 lg:pr-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-accent-pink/25 bg-accent-pink/10">
                <UserRound className="h-5 w-5 text-white/90" />
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent-pink/90">
                  Tööotsija
                </div>
                <p className="text-sm font-medium text-white/45">Profiil</p>
              </div>
            </div>

            <h3 className="mt-6 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Näita tugevust,
              <span className="block text-white/55"> mitte pikkust.</span>
            </h3>

            <div className="relative mt-10 border-l border-white/[0.1] pl-7 sm:pl-8">
              <div
                aria-hidden="true"
                className="absolute left-0 top-2 h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-accent-pink/50 via-violet-400/30 to-transparent"
              />

              <ol className="space-y-10">
                {seekerSteps.map((s, i) => (
                  <motion.li
                    key={s.n}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.45, delay: 0.06 * i }}
                    className="relative"
                  >
                    <span
                      className={cn(
                        "absolute -left-7 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border text-[10px] font-mono font-semibold sm:-left-8 sm:h-8 sm:w-8 sm:text-[11px]",
                        i === 0
                          ? "border-accent-pink/40 bg-black/50 text-accent-pink/95"
                          : "border-white/[0.12] bg-black/40 text-white/55",
                      )}
                    >
                      {s.n}
                    </span>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/38">
                      {s.title}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/65 sm:text-[15px]">
                      {s.line}
                    </p>
                  </motion.li>
                ))}
              </ol>
            </div>

            <div className="mt-12">
              <Button
                asChild
                variant="primary"
                className="h-12 w-full rounded-2xl sm:w-auto sm:min-w-[220px]"
              >
                <Link href="/toootsijatele">
                  Otsin tööd
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Tööandja — kompaktne süsteemi-eelvaade, nõuete / värbamise keskne */}
          <motion.div
            id="tooandjatele"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="scroll-mt-28 lg:col-span-5 lg:mt-16 xl:mt-20"
          >
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-4 rounded-[36px] bg-[radial-gradient(ellipse_at_70%_0%,rgba(168,85,247,0.2),transparent_55%)] blur-2xl"
              />

              <div className="relative overflow-hidden rounded-[28px] border border-white/[0.11] bg-gradient-to-b from-white/[0.07] to-black/55 p-1 shadow-[0_32px_100px_-40px_rgba(0,0,0,0.9)]">
                <div className="rounded-[26px] border border-white/[0.06] bg-black/35 px-5 py-5 sm:px-6 sm:py-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.05]">
                        <Briefcase className="h-4 w-4 text-white/80" />
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-violet-300/90">
                          Tööandja
                        </div>
                        <p className="text-xs text-white/45">Nõuded ja kandidaadid</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
                      eelvaade
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold leading-snug tracking-tight text-white sm:text-xl">
                    Värbamine ilma arvamisega
                  </h3>

                  <div className="mt-6 space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="flex items-center gap-2 text-white/55">
                        <ClipboardList className="h-4 w-4 text-white/40" />
                        Aktiivsed nõuded
                      </span>
                      <span className="font-mono text-sm tabular-nums text-white/80">3</span>
                    </div>
                    <div className="h-px bg-white/[0.06]" />
                    <div className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="flex items-center gap-2 text-white/55">
                        <Users className="h-4 w-4 text-white/40" />
                        Sobivad kandidaadid
                      </span>
                      <div className="flex -space-x-2">
                        {[0, 1, 2].map((k) => (
                          <span
                            key={k}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-black/60 bg-gradient-to-br from-white/15 to-white/5 text-[9px] font-medium text-white/70"
                          >
                            {k + 1}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="h-px bg-white/[0.06]" />
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-white/42">
                        <span className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-white/35" />
                          Parim kattuvus
                        </span>
                        <span className="font-mono tabular-nums text-white/65">8/10</span>
                      </div>
                      <div className="mt-2 flex gap-1">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1 flex-1 rounded-full",
                              i < 8
                                ? "bg-gradient-to-r from-violet-500/70 to-fuchsia-500/50"
                                : "bg-white/[0.08]",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-relaxed text-white/52">
                    Nõuded üks kord. Vastused kohe.
                  </p>

                  <div className="mt-6">
                    <Button
                      asChild
                      variant="outline"
                      className="h-12 w-full rounded-2xl border-white/[0.18] bg-white/[0.03] hover:bg-white/[0.08]"
                    >
                      <Link href="/tooandjatele">
                        Pakun tööd
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute -right-3 top-1/4 hidden h-24 w-24 rounded-full border border-white/[0.05] xl:block" />
              <Sparkles className="pointer-events-none absolute -left-2 top-8 h-5 w-5 text-violet-400/30" aria-hidden />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
