import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-black/30">
      <Container>
        <div className="py-12">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr]">
            <div>
              <Logo className="opacity-95" />
              <p className="mt-4 max-w-md text-sm leading-6 text-white/65">
                Eesti tööturul. Pädevus esikohal.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-2">
              <div className="space-y-3 text-sm">
                <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
                  Platvorm
                </div>
                <Link className="block text-white/70 hover:text-white" href="/tood">
                  Tööd
                </Link>
                <Link
                  className="block text-white/70 hover:text-white"
                  href="/tooandjatele"
                >
                  Tööandjatele
                </Link>
                <Link
                  className="block text-white/70 hover:text-white"
                  href="/toootsijatele"
                >
                  Tööotsijatele
                </Link>
              </div>

              <div className="space-y-3 text-sm">
                <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
                  Info
                </div>
                <Link className="block text-white/70 hover:text-white" href="#kontakt">
                  Kontakt
                </Link>
                <Link
                  className="block text-white/70 hover:text-white"
                  href="#privaatsus"
                >
                  Privaatsus
                </Link>
                <Link
                  className="block text-white/70 hover:text-white"
                  href="#tingimused"
                >
                  Tingimused
                </Link>
              </div>
            </div>
          </div>

          <Separator className="my-10 bg-white/[0.08]" />

          <div className="flex flex-col gap-3 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} Kvalifits</div>
            <div className="text-white/45">Eesti · pädevuspõhine töövahendus</div>
          </div>
        </div>
      </Container>
    </footer>
  );
}

