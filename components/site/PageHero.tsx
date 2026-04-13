"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { AmbientBackground } from "@/components/site/AmbientBackground";
import { Container } from "@/components/ui/container";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden">
      <AmbientBackground intensity="soft" />
      <Container className="relative">
        <div className="pt-20 sm:pt-24 lg:pt-28 pb-16 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mx-auto max-w-3xl">
              <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
                {eyebrow}
              </div>
              <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 text-base leading-7 text-white/65">{subtitle}</p>
            </div>
            {children ? <div className="mt-10 w-full">{children}</div> : null}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

