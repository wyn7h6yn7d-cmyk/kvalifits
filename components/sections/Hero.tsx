"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { AmbientBackground } from "@/components/site/AmbientBackground";
import { PortalBackground } from "@/components/site/portal-background";
import { heroPortal } from "@/lib/site-portal-config";
import { cn } from "@/lib/utils";

const heroPrimaryCta =
  "relative h-14 min-w-[200px] rounded-2xl px-9 text-[15px] font-semibold tracking-tight shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_22px_56px_-14px_rgba(168,85,247,0.55),0_8px_24px_-8px_rgba(227,31,141,0.25)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.14)_inset,0_28px_72px_-12px_rgba(168,85,247,0.62),0_12px_32px_-6px_rgba(227,31,141,0.3)] active:translate-y-0";

const heroSecondaryCta =
  "h-14 min-w-[180px] rounded-2xl border-white/[0.22] bg-white/[0.04] px-8 text-[15px] font-semibold tracking-tight text-white backdrop-blur-md transition-all duration-300 hover:border-white/[0.32] hover:bg-white/[0.09] hover:shadow-[0_0_40px_-12px_rgba(255,255,255,0.12)]";

function HeroMatchMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[min(100%,440px)]">
      <div
        aria-hidden="true"
        className="absolute -inset-8 rounded-[48px] bg-[conic-gradient(from_140deg_at_50%_50%,rgba(168,85,247,0.45),transparent_42%,rgba(227,31,141,0.22),transparent_78%)] opacity-90 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -inset-px rounded-[34px] bg-gradient-to-br from-white/[0.18] via-white/[0.04] to-transparent opacity-80"
      />

      <div className="relative overflow-hidden rounded-[32px] border border-white/[0.14] bg-gradient-to-b from-white/[0.09] via-black/40 to-black/70 p-px shadow-[0_32px_120px_-40px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.05)_inset] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(168,85,247,0.2),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_100%,rgba(227,31,141,0.1),transparent_50%)]" />

        <div className="relative flex flex-col gap-6 p-7 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/40">
                Sobitus
              </span>
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300/90">
                reaalajas
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/40">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-emerald-400/50" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              värske
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-4 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-2 md:gap-3">
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-2xl border border-white/[0.1] bg-white/[0.05] px-3 py-3 sm:px-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-black/35">
                  <UserRound className="h-4 w-4 text-white/75" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
                    Tööotsija
                  </div>
                  <div className="truncate text-sm font-medium text-white/90">Elektrik</div>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-col items-center gap-1 px-1">
              <div className="relative hidden h-px w-full min-w-[2.5rem] bg-gradient-to-r from-transparent via-white/35 to-transparent sm:block" />
              <div className="relative -mt-0 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.14] bg-gradient-to-b from-violet-500/25 to-black/60 shadow-[0_0_24px_-4px_rgba(168,85,247,0.45)] sm:-mt-[13px]">
                <span className="font-mono text-lg font-semibold tabular-nums text-white">
                  87<span className="text-sm text-white/45">%</span>
                </span>
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/35">
                sobivus
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.28 }}
              className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-3 py-3 sm:px-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-black/30">
                  <Building2 className="h-4 w-4 text-white/70" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
                    Tööandja
                  </div>
                  <div className="truncate text-sm font-medium text-white/85">Positsioon</div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />

          <div className="space-y-3.5">
            <p className="font-mono text-[11px] leading-relaxed tracking-[0.04em] text-white/55 sm:text-xs">
              Elektrik · A-pädevus · Sobivus{" "}
              <span className="text-white/80">87%</span>
            </p>

            <div className="flex items-center gap-2.5 text-sm text-white/65">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400/85" />
              <span>Sertifikaat kontrollitud</span>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-white/45">
                <span>Nõuded</span>
                <span className="font-mono tabular-nums text-white/55">8/10</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "80%" }}
                  transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500/80 via-fuchsia-500/70 to-[rgba(227,31,141,0.75)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section
      id="avaleht"
      className="relative min-h-[min(96vh,940px)] overflow-hidden scroll-mt-0"
    >
      <AmbientBackground intensity={heroPortal.ambientIntensity} />
      <div className="absolute inset-0 z-0">
        <PortalBackground variant={heroPortal.variant} intensity={heroPortal.intensity} />
      </div>

      {/* Luksuslik tumedam valgus: vignett + spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_130%_90%_at_50%_-15%,rgba(168,85,247,0.32),transparent_52%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_100%_30%,rgba(99,102,241,0.14),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_70%,rgba(227,31,141,0.1),transparent_48%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_100%)] opacity-70" />
      </div>

      <Container className="relative z-10">
        <div className="flex flex-col justify-center pb-20 pt-24 sm:pb-24 sm:pt-28 lg:pb-32 lg:pt-36">
          <div className="grid items-center gap-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20 xl:gap-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[40rem] xl:max-w-[44rem]"
            >
              <div className="inline-flex items-center gap-3 rounded-full border border-white/[0.14] bg-white/[0.05] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-violet-300/90" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/50">
                  Kvalifits
                </span>
                <span className="h-3 w-px bg-white/15" aria-hidden="true" />
                <span className="text-[13px] font-medium tracking-tight text-white/78">
                  Eesti tööturul
                </span>
              </div>

              <h1 className="mt-10 text-balance text-[2.85rem] font-semibold leading-[1.02] tracking-[-0.035em] text-white sm:text-6xl lg:text-[4.65rem] xl:text-[5.1rem]">
                Töö, kus{" "}
                <span className="text-gradient-brand font-semibold">pädevus</span>
                <br className="hidden sm:block" />
                <span className="text-white/[0.96]">ei jää arvamuse taha.</span>
              </h1>

              <p className="mt-8 max-w-xl text-pretty text-lg leading-relaxed text-white/55 sm:text-xl sm:leading-relaxed lg:text-[1.35rem] lg:leading-relaxed">
                Oskused nähtaval. Sobivus nähtav. Ilma mürata.
              </p>

              <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                <Button asChild variant="primary" size="lg" className={cn(heroPrimaryCta)}>
                  <Link href="#toootsijatele">
                    Otsin tööd <ArrowRight className="h-[1.05rem] w-[1.05rem]" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className={cn(heroSecondaryCta)}>
                  <Link href="#tooandjatele">Pakun tööd</Link>
                </Button>
              </div>

              <div className="mt-14 flex flex-wrap items-center gap-x-10 gap-y-2 border-t border-white/[0.09] pt-10 text-[13px] tracking-wide text-white/38">
                <span className="text-white/48">Üle Eesti</span>
                <span className="hidden h-3.5 w-px bg-white/12 sm:block" />
                <span>Spetsialistid · meistrid · kontor · IT</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex justify-center lg:justify-end"
            >
              <HeroMatchMockup />
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
