"use client";

import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  CheckCircle2,
  Fingerprint,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { GradientAccentText } from "@/components/site/GradientAccentText";
import { Container } from "@/components/ui/container";
import { PortalBackground } from "@/components/site/portal-background";
import { subtleSectionPortal } from "@/lib/site-portal-config";
import { cn } from "@/lib/utils";

const SEGMENTS = 10;
const FILLED = 8;

function FloatingSignal({
  className,
  children,
  drift,
  delay,
}: {
  className?: string;
  children: React.ReactNode;
  drift: number;
  delay: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -10, 0] }}
        transition={{
          duration: drift,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay * 0.6,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function SignalCard({
  text,
  sub,
  icon: Icon,
}: {
  text: string;
  sub: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative max-w-[280px] rounded-[22px] border border-white/[0.12] bg-gradient-to-b from-white/[0.11] to-white/[0.03] px-4 py-4 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl">
      <div className="absolute -inset-px rounded-[22px] bg-gradient-to-br from-violet-400/10 via-transparent to-accent-pink/5 opacity-70" />
      <div className="relative flex gap-3.5">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-black/35">
          <Icon className="h-4 w-4 text-white/80" />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-snug tracking-tight text-white/92 sm:text-[15px]">{text}</p>
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-wide text-white/48">
            {sub}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SmartMatching() {
  const reduce = useReducedMotion();
  const t = useTranslations("smartMatching");

  const floatCards = [
    {
      top: "lg:top-[5%]",
      bottom: "",
      left: "lg:left-3",
      right: "",
      text: t("card1"),
      sub: t("card1Sub"),
      icon: Sparkles,
      delay: 0,
      drift: 5.5,
    },
    {
      top: "lg:top-[18%]",
      bottom: "",
      left: "",
      right: "lg:right-3",
      text: t("card2"),
      sub: t("card2Sub"),
      icon: ShieldCheck,
      delay: 0.4,
      drift: 6.8,
    },
    {
      top: "",
      bottom: "lg:bottom-5",
      left: "",
      right: "lg:right-3",
      text: t("card3"),
      sub: t("card3Sub"),
      icon: CheckCircle2,
      delay: 0.8,
      drift: 7.2,
    },
  ] as const;

  return (
    <section id="tood" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32">
      {subtleSectionPortal.enabled ? (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ opacity: subtleSectionPortal.opacity }}
          aria-hidden="true"
        >
          <PortalBackground
            variant={subtleSectionPortal.variant}
            intensity={subtleSectionPortal.intensity}
          />
        </div>
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_0%,rgba(168,85,247,0.2),transparent_58%),radial-gradient(ellipse_80%_55%_at_100%_55%,rgba(227,31,141,0.08),transparent_52%),radial-gradient(ellipse_60%_50%_at_0%_40%,rgba(99,102,241,0.08),transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.2] to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/55"
      />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-1.5 text-[11px] font-medium uppercase tracking-wide text-white/55">
            {t("badge")}
          </div>
          <h2 className="mt-7 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
            {t("title")}
            <span className="mt-2 block">
              <GradientAccentText wrapClassName="font-semibold">{t("titleAccent")}</GradientAccentText>
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-white/58 sm:text-lg sm:leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="relative mx-auto mt-20 max-w-6xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[95%] max-w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-[48px] bg-[radial-gradient(ellipse_at_50%_40%,rgba(168,85,247,0.22),transparent_65%)] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[12%] top-[30%] h-72 w-72 rounded-full bg-violet-500/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[18%] right-[8%] h-64 w-64 rounded-full bg-accent-pink/10 blur-3xl"
          />

          <div className="relative rounded-[40px] border border-white/[0.12] bg-gradient-to-b from-white/[0.08] via-black/50 to-black/80 p-px shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]">
            <div className="absolute inset-0 rounded-[40px] bg-[linear-gradient(135deg,rgba(255,255,255,0.07)_0%,transparent_45%,transparent_100%)]" />
            <div className="relative overflow-hidden rounded-[39px]">
              <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />

              <div className="relative px-6 pb-14 pt-12 sm:px-12 sm:pb-16 sm:pt-14 lg:min-h-[580px] lg:px-10 lg:pb-28 lg:pt-14">
                <div className="hidden lg:block">
                  {floatCards.map((c) => (
                    <FloatingSignal
                      key={c.text}
                      drift={c.drift}
                      delay={c.delay}
                      className={cn(
                        "absolute z-[15] w-[min(100%,260px)] max-lg:max-w-none",
                        c.top,
                        c.bottom,
                        c.left,
                        c.right,
                      )}
                    >
                      <SignalCard text={c.text} sub={c.sub} icon={c.icon} />
                    </FloatingSignal>
                  ))}
                </div>

                <div className="relative z-20 mx-auto flex max-w-lg flex-col items-center text-center lg:max-w-xl lg:px-4">
                  <div className="flex items-center gap-2.5 text-[12px] font-medium uppercase tracking-wide text-white/48">
                    <Fingerprint className="h-3.5 w-3.5 shrink-0 text-violet-300/75" aria-hidden />
                    {t("fitLabel")}
                  </div>

                  <div className="mt-5">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.div
                        animate={reduce ? undefined : { scale: [1, 1.02, 1] }}
                        transition={{
                          duration: 7,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <GradientAccentText wrapClassName="inline-block px-1 font-mono text-[clamp(3.5rem,11vw,6.75rem)] font-semibold leading-none tracking-[-0.04em]">
                          87%
                        </GradientAccentText>
                      </motion.div>
                    </motion.div>
                  </div>
                  <p className="mt-3 text-[15px] leading-snug text-white/55 sm:text-base">{t("withPosition")}</p>

                  <div className="mt-12 w-full text-left">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[12px] font-medium uppercase tracking-wide text-white/50">
                          {t("reqSkill")}
                        </p>
                        <p className="mt-2 text-lg font-medium text-white/88">{t("filled")}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-white/52">
                        <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400/90" aria-hidden />
                        {t("overlap")}
                      </div>
                    </div>

                    <div
                      className="mt-5 flex gap-1 sm:gap-1.5"
                      role="img"
                      aria-label={t("segmentsAria")}
                    >
                      {Array.from({ length: SEGMENTS }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scaleY: 0.4 }}
                          whileInView={{ opacity: 1, scaleY: 1 }}
                          viewport={{ once: true }}
                          transition={{
                            delay: 0.05 * i,
                            duration: 0.35,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className={cn(
                            "h-2 flex-1 origin-bottom rounded-full sm:h-2.5",
                            i < FILLED
                              ? "bg-gradient-to-r from-violet-400/85 via-fuchsia-400/60 to-[rgba(227,31,141,0.65)] shadow-[0_0_16px_-4px_rgba(168,85,247,0.45)]"
                              : "bg-white/[0.07]",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mx-auto mt-12 max-w-md space-y-4 lg:hidden">
                  {floatCards.map((c, idx) => (
                    <motion.div
                      key={c.text}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-20px" }}
                      transition={{ duration: 0.5, delay: 0.08 * idx }}
                    >
                      <SignalCard text={c.text} sub={c.sub} icon={c.icon} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
