"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { AmbientBackground } from "@/components/site/AmbientBackground";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
  prepend,
  ambient = true,
}: {
  eyebrow: string;
  title: string;
  subtitle: ReactNode;
  children?: ReactNode;
  /** Rendered first (e.g. tutorial) — full width above eyebrow/title/subtitle */
  prepend?: ReactNode;
  /** When false, no gradient glow (e.g. employer landing lead strip) */
  ambient?: boolean;
}) {
  return (
    <section
      className={cn("relative overflow-hidden", !ambient && "border-b border-white/[0.06] bg-background")}
    >
      {ambient ? <AmbientBackground intensity="soft" /> : null}
      <Container className="relative">
        <div
          className={cn(
            "pt-20 sm:pt-24 lg:pt-28",
            ambient ? "pb-16 sm:pb-20" : "pb-20 sm:pb-24 lg:pb-[6.5rem]",
          )}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {prepend ? <div className="mb-10 w-full sm:mb-12">{prepend}</div> : null}
            <div className="mx-auto max-w-3xl">
              <div className="text-[13px] font-medium uppercase tracking-wide text-white/60 sm:text-sm">
                {eyebrow}
              </div>
              <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 text-base leading-[1.65] text-white/68 sm:text-[1.0625rem] sm:leading-relaxed">
                {subtitle}
              </p>
            </div>
            {children ? <div className="mt-10 w-full">{children}</div> : null}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

