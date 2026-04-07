"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function FinalCTA() {
  return (
    <section id="registreeru" className="relative py-24 sm:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative overflow-hidden rounded-[36px] border border-white/[0.10] bg-white/[0.02] px-8 py-10 sm:px-12 sm:py-14 backdrop-blur-xl">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(168,85,247,0.40),transparent_62%),radial-gradient(circle_at_85%_85%,rgba(227,31,141,0.16),transparent_58%)]"
            />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1.45fr_0.55fr]">
              <div>
                <h3 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Leia töö või töötaja, kelle oskused on päriselt kontrollitud.
                </h3>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
                  Selge, elegantne ja usaldusväärne viis leida sobivus — üle erinevate
                  erialade ja sektorite.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild variant="primary" size="lg">
                  <Link href="#toootsijatele">
                    Otsin tööd <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#tooandjatele">Pakun tööd</Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

