"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

function Column({
  id,
  eyebrow,
  title,
  lines,
  cta,
  tone,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lines: string[];
  cta: string;
  tone: "violet" | "neutral";
}) {
  return (
    <div
      id={id}
      className="scroll-mt-24 rounded-3xl border border-white/[0.10] bg-white/[0.03] p-8 backdrop-blur-md"
    >
      <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
        {eyebrow}
      </div>
      <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
        {title}
      </h3>
      <div className="mt-5 space-y-2 text-sm leading-6 text-white/65">
        {lines.map((l) => (
          <div key={l} className="flex gap-3">
            <span
              className={
                "mt-2 h-1.5 w-1.5 shrink-0 rounded-full " +
                (tone === "violet"
                  ? "bg-violet-300/60"
                  : "bg-white/35")
              }
            />
            <span>{l}</span>
          </div>
        ))}
      </div>
      <div className="mt-7">
        <Button variant={tone === "violet" ? "primary" : "outline"} className="w-full">
          {cta}
        </Button>
      </div>
    </div>
  );
}

export function Audience() {
  return (
    <section className="relative py-20 sm:py-24">
      <Container>
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div className="max-w-xl">
            <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
              Kellele see on
            </div>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Kahele poolele. Üks premium standard.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/65">
              Kvalifits sobib spetsialistidele ja tööandjatele, kes eelistavad selgust,
              kvaliteeti ja kontrollitavaid oskusi.
            </p>
          </div>

          <div className="grid gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <Column
                id="toootsijatele"
                eyebrow="Tööotsijale"
                title="Näita, mida oskad — ilma üle seletamata."
                lines={[
                  "Loo profiil",
                  "Lisa oskused ja sertifikaadid",
                  "Saa sobivad töövõimalused",
                ]}
                cta="Otsin tööd"
                tone="violet"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <Column
                id="tooandjatele"
                eyebrow="Tööandjale"
                title="Leia õige inimene — kindlama sobivusega."
                lines={[
                  "Lisa tööpakkumine",
                  "Määra nõuded",
                  "Leia kontrollitud kandidaadid",
                ]}
                cta="Pakun tööd"
                tone="neutral"
              />
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}

