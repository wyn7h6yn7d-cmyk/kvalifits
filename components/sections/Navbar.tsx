"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, ArrowRight } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Avaleht" },
  { href: "/tooandjatele", label: "Tööandjatele" },
  { href: "/toootsijatele", label: "Tööotsijatele" },
  { href: "/tood", label: "Tööd" },
] as const;

function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm text-white/70 hover:text-white transition-colors",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="sticky top-0 z-50">
      <div
        className={cn(
          "border-b border-transparent transition-all",
          scrolled ? "border-white/[0.08]" : "border-transparent"
        )}
      >
        <div
          className={cn(
            "bg-black/40 backdrop-blur-xl transition-all",
            scrolled ? "bg-black/55" : "bg-black/30"
          )}
        >
          <Container>
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-3">
                <Logo />
              </div>

              <nav className="hidden items-center gap-7 lg:flex">
                {navItems.map((item) => (
                  <NavLink key={item.href} href={item.href}>
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="hidden items-center gap-3 lg:flex">
                <NavLink href="/#login" className="text-white/75">
                  Logi sisse
                </NavLink>
                <Button asChild variant="primary" size="sm">
                  <Link href="/#registreeru">
                    Registreeru <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Ava menüü">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetTitle className="pr-12">Menüü</SheetTitle>

                    <div className="mt-6 flex flex-col gap-4">
                      {navItems.map((item) => (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.22 }}
                        >
                          <Link
                            href={item.href}
                            className="flex items-center justify-between rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/85 hover:bg-white/[0.07]"
                          >
                            {item.label}
                            <span className="text-white/45">↗</span>
                          </Link>
                        </motion.div>
                      ))}

                      <div className="pt-2">
                        <div className="flex items-center gap-3">
                          <Button asChild variant="ghost" className="flex-1">
                            <Link href="/#login">Logi sisse</Link>
                          </Button>
                          <Button asChild variant="primary" className="flex-1">
                            <Link href="/#registreeru">Registreeru</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </Container>
        </div>
      </div>

      <AnimatePresence>
        {!scrolled ? (
          <motion.div
            key="hairline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

