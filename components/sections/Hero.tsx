"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { AmbientBackground } from "@/components/site/AmbientBackground";

export function Hero() {
  return (
    <section id="avaleht" className="relative overflow-hidden">
      <AmbientBackground intensity="default" />

      <Container className="relative">
        <div className="pt-20 sm:pt-24 lg:pt-28 pb-20 sm:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="flex justify-center">
              <Badge variant="violet" className="gap-2">
                <Sparkles className="h-3.5 w-3.5 text-white/70" />
                <span className="text-white/85">
                  Verifitseeritud oskused. Usaldusväärsed sobivused.
                </span>
              </Badge>
            </div>

            <h1 className="mt-7 text-balance text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Tunnustatud tööandjad.
              <br />
              Kvalifitseeritud töötajad.
            </h1>
            <p className="mt-6 text-pretty text-base leading-7 text-white/65 sm:text-lg">
              Kvalifits viib kokku tööandjad ja spetsialistid, kelle oskused on päriselt
              kontrollitavad.
            </p>

            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Button asChild variant="primary" size="lg">
                <Link href="#toootsijatele">
                  Otsin tööd <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#tooandjatele">Pakun tööd</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-14 max-w-5xl"
          >
            <div className="relative mx-auto">
              <div
                aria-hidden="true"
                className="absolute -inset-6 rounded-[36px] bg-[radial-gradient(circle_at_30%_10%,rgba(168,85,247,0.22),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(227,31,141,0.10),transparent_55%)] blur-2xl"
              />
              <div className="relative rounded-[30px] border border-white/[0.10] bg-white/[0.03] p-7 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-medium text-white/85">
                    Premium sobivuse signaalid
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <BadgeCheck className="h-4 w-4 text-white/60" />
                    kontrollitud
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { k: "Sertifikaadid", v: "kontrollitud" },
                    { k: "Sobivus", v: "87%" },
                    { k: "Usaldus", v: "kõrge" },
                  ].map((x) => (
                    <div
                      key={x.k}
                      className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-4"
                    >
                      <div className="text-xs text-white/50">{x.k}</div>
                      <div className="mt-2 text-sm font-medium text-white/85">{x.v}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {["Elektrik", "A-pädevus", "Tallinn"].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1 text-xs text-white/70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

