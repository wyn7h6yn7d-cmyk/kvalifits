"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Bell, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";

const notes = [
  {
    text: "Sertifikaat kontrollitud",
    meta: "A-pädevus · Eesti",
    tone: "pink",
  },
  {
    text: "Sobid sellele positsioonile",
    meta: "Sobivus 87%",
    tone: "violet",
  },
  {
    text: "Kandidaadi oskused vastavad nõuetele",
    meta: "8/10 nõudest täidetud",
    tone: "neutral",
  },
] as const;

function Note({
  text,
  meta,
  tone,
}: {
  text: string;
  meta: string;
  tone: "pink" | "violet" | "neutral";
}) {
  const bg =
    tone === "pink"
      ? "bg-[radial-gradient(circle_at_30%_0%,rgba(227,31,141,0.18),transparent_60%)]"
      : tone === "violet"
        ? "bg-[radial-gradient(circle_at_30%_0%,rgba(168,85,247,0.22),transparent_60%)]"
        : "bg-[radial-gradient(circle_at_30%_0%,rgba(255,255,255,0.09),transparent_60%)]";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.04] p-4 backdrop-blur-md">
      <div aria-hidden="true" className={"absolute inset-0 " + bg} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05]">
            <Bell className="h-4 w-4 text-white/80" />
          </div>
          <div>
            <div className="text-sm font-medium text-white/85">{text}</div>
            <div className="mt-1 text-xs text-white/55">{meta}</div>
          </div>
        </div>
        <div className="text-xs text-white/45">•</div>
      </div>
    </div>
  );
}

export function SmartMatching() {
  return (
    <section id="tood" className="relative py-20 sm:py-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="max-w-xl">
            <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
              Nutikas sobitamine
            </div>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Sobitused, mis põhjendavad end.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/65">
              Kvalifits ühendab verifitseerimise ja sobivusloogika — nii tööotsija kui
              tööandja näevad selgelt, mis on kontrollitud ja miks see sobib.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="violet">
                <Sparkles className="h-3.5 w-3.5 text-white/70" /> sobivusprotsent
              </Badge>
              <Badge variant="default">
                <BadgeCheck className="h-3.5 w-3.5 text-white/60" /> verifitseeritud
              </Badge>
              <Badge variant="pink">aktsent</Badge>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div
              aria-hidden="true"
              className="absolute -inset-6 rounded-[32px] bg-[radial-gradient(circle_at_30%_10%,rgba(168,85,247,0.22),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(227,31,141,0.12),transparent_55%)] blur-2xl"
            />

            <div className="relative rounded-[28px] border border-white/[0.10] bg-white/[0.03] p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white/85">Teavitused</div>
                <div className="text-xs text-white/45">reaalajas</div>
              </div>

              <div className="mt-5 grid gap-3">
                {notes.map((n, idx) => (
                  <motion.div
                    key={n.text}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.06 }}
                  >
                    <Note text={n.text} meta={n.meta} tone={n.tone} />
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3">
                <div className="text-xs text-white/55">Sobivus</div>
                <div className="text-sm font-medium text-white/85">87%</div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

