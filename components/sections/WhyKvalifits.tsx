"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { Container } from "@/components/ui/container";

const points = [
  {
    title: "Verifitseeritud oskused",
    desc: "Sertifikaadid ja pädevused on selgelt nähtavad ja usaldusväärsed.",
  },
  {
    title: "Kiirem sobitamine",
    desc: "Vähem müra — rohkem sobivaid pakkumisi ja kandidaate.",
  },
  {
    title: "Rohkem usaldust värbamisel",
    desc: "Otsused põhinevad tõenditel, mitte oletustel.",
  },
] as const;

export function WhyKvalifits() {
  return (
    <section id="miks" className="relative py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
            Miks Kvalifits
          </div>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Üks platvorm, mis väärtustab päris pädevust.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {points.map((p, idx) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: idx * 0.03, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-white/[0.10] bg-white/[0.03] px-6 py-7 backdrop-blur-md"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-white/90">
                <CheckCircle2 className="h-4 w-4 text-white/55" />
                {p.title}
              </div>
              <p className="mt-3 text-sm leading-6 text-white/65">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

