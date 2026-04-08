"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Menu, ArrowRight } from "lucide-react";

import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Role = "seeker" | "employer";

const GUEST_NAV_PATHS = [
  { href: "/", key: "home" as const },
  { href: "/tooandjatele", key: "employers" as const },
  { href: "/toootsijatele", key: "seekers" as const },
  { href: "/tood", key: "jobs" as const },
];

const SEEKER_NAV_PATHS = [
  { href: "/", key: "home" as const },
  { href: "/tood", key: "jobs" as const },
  { href: "/account/seeker", key: "seekerArea" as const },
];

const EMPLOYER_NAV_PATHS = [
  { href: "/", key: "home" as const },
  { href: "/account/employer", key: "employerArea" as const },
  { href: "/account/employer/candidates", key: "candidates" as const },
];

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
        "inline-flex h-7 shrink-0 items-center justify-center rounded-md px-2 text-[13px] font-medium leading-none text-white/70 transition-colors hover:text-white",
        className
      )}
    >
      {children}
    </Link>
  );
}

const langTriggerNavbar =
  "!h-7 !min-h-0 !w-auto shrink-0 gap-1.5 px-1.5 py-0 leading-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]";

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [authed, setAuthed] = useState<boolean>(false);
  const [authResolved, setAuthResolved] = useState<boolean>(false);
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const supabase = (supabaseRef.current ??= createSupabaseBrowserClient());
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;
      setAuthed(Boolean(user));
      setAuthResolved(true);

      if (!user) {
        setRole(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;
      const r = profile?.role;
      setRole(r === "seeker" || r === "employer" ? r : null);
    }

    void load();
    const supabase = (supabaseRef.current ??= createSupabaseBrowserClient());
    const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  /** Üks kiht: taust + blur + border samal elemendil kui rida → üks pidev klaasriba */
  const glassBar = cn(
    "isolate flex h-[var(--site-header-bar)] min-h-0 w-full max-w-6xl items-center justify-between gap-2 rounded-2xl border px-2.5 py-0 backdrop-blur-xl backdrop-saturate-150 sm:gap-3 sm:px-4 lg:justify-start lg:gap-0 lg:px-5",
    "border-white/[0.11] bg-[rgba(5,5,8,0.78)] shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_12px_40px_-14px_rgba(0,0,0,0.5),0_0_50px_-18px_rgba(124,58,237,0.07)]",
    scrolled &&
      "border-white/[0.15] bg-[rgba(5,5,8,0.85)] shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset,0_14px_44px_-12px_rgba(0,0,0,0.55),0_0_56px_-16px_rgba(124,58,237,0.09)]",
  );

  const navPaths =
    authResolved && authed
      ? role === "employer"
        ? EMPLOYER_NAV_PATHS
        : role === "seeker"
          ? SEEKER_NAV_PATHS
          : GUEST_NAV_PATHS
      : GUEST_NAV_PATHS;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pb-[var(--site-header-tail)] pt-[var(--site-header-top)] sm:px-4">
      <div className="pointer-events-auto mx-auto flex w-full justify-center">
        <div className={glassBar}>
          <div className="flex h-full min-h-0 min-w-0 shrink-0 items-center">
            <Logo className="inline-flex h-full max-h-full min-h-0 items-center leading-none" />
          </div>

          <nav
            className="hidden h-full min-h-0 min-w-0 flex-1 items-center justify-center gap-2 lg:flex xl:gap-4"
            aria-label={t("menu")}
          >
            {navPaths.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          <div className="flex h-full min-h-0 min-w-0 shrink-0 items-center justify-end gap-1 sm:gap-1.5 lg:ml-1.5">
            <div className="hidden h-full min-h-0 items-center gap-1.5 lg:flex">
              {authResolved && authed ? (
                <>
                  {role === "seeker" ? (
                    <Link
                      href="/account/seeker"
                      className="inline-flex h-7 shrink-0 items-center justify-center text-[13px] font-medium leading-none text-white/80 transition-colors hover:text-white"
                    >
                      {t("seekerArea")}
                    </Link>
                  ) : null}
                  {role === "employer" ? (
                    <>
                      <Link
                        href="/account/employer"
                        className="inline-flex h-7 shrink-0 items-center justify-center text-[13px] font-medium leading-none text-white/80 transition-colors hover:text-white"
                      >
                        {t("employerArea")}
                      </Link>
                      <Button
                        asChild
                        variant="primary"
                        size="sm"
                        className="h-7 shrink-0 rounded-md px-2.5 text-[13px] leading-none"
                      >
                        <Link
                          href="/account/employer/jobs/new"
                          className="inline-flex h-full min-h-0 items-center justify-center gap-1.5"
                        >
                          {t("addJob")} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </>
                  ) : null}
                  {role === null ? (
                    <Link
                      href="/account"
                      className="inline-flex h-7 shrink-0 items-center justify-center text-[13px] font-medium leading-none text-white/80 transition-colors hover:text-white"
                    >
                      {t("account")}
                    </Link>
                  ) : null}

                  <form action={`/${locale}/auth/logout`} method="post">
                    <button
                      type="submit"
                      className="inline-flex h-7 shrink-0 items-center justify-center text-[13px] font-medium leading-none text-white/80 transition-colors hover:text-white"
                    >
                      {t("logout")}
                    </button>
                  </form>
                </>
              ) : authResolved ? (
                <>
                  <Link
                    href="/auth/login"
                    className="inline-flex h-7 shrink-0 items-center justify-center text-[13px] font-medium leading-none text-white/80 transition-colors hover:text-white"
                  >
                    {t("login")}
                  </Link>
                  <Button
                    asChild
                    variant="primary"
                    className="h-7 shrink-0 rounded-md !px-2 text-[12px] leading-none"
                  >
                    <Link
                      href="/auth/register"
                      className="inline-flex h-full min-h-0 items-center justify-center gap-0"
                    >
                      <span>{t("signup")}</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="h-7 w-[172px]" aria-hidden="true" />
              )}
              <div className="flex h-full shrink-0 items-center">
                <LanguageSwitcher triggerClassName={langTriggerNavbar} />
              </div>
            </div>

            <div className="flex h-full min-h-0 items-center gap-2 lg:hidden">
              <div className="flex h-full shrink-0 items-center">
                <LanguageSwitcher triggerClassName={langTriggerNavbar} />
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 shrink-0 rounded-md border-white/[0.14] bg-white/[0.06]"
                    aria-label={t("openMenu")}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetTitle className="pr-12">{t("menu")}</SheetTitle>

                  <div className="mt-6 flex flex-col gap-4">
                    {navPaths.map((item) => (
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
                          {t(item.key)}
                          <span className="text-white/45">↗</span>
                        </Link>
                      </motion.div>
                    ))}

                    <div className="pt-2">
                      <div className="flex flex-col gap-3">
                        {authResolved && authed ? (
                          <>
                            {role === "seeker" ? (
                              <Button asChild variant="ghost" className="w-full">
                                <Link href="/account/seeker">{t("seekerArea")}</Link>
                              </Button>
                            ) : null}
                            {role === "employer" ? (
                              <>
                                <Button asChild variant="ghost" className="w-full">
                                  <Link href="/account/employer">{t("employerArea")}</Link>
                                </Button>
                                <Button asChild variant="primary" className="w-full">
                                  <Link href="/account/employer/jobs/new">{t("addJob")}</Link>
                                </Button>
                              </>
                            ) : null}
                            {role === null ? (
                              <Button asChild variant="ghost" className="w-full">
                                <Link href="/account">{t("account")}</Link>
                              </Button>
                            ) : null}
                            <form action={`/${locale}/auth/logout`} method="post">
                              <Button variant="outline" className="w-full">
                                {t("logout")}
                              </Button>
                            </form>
                          </>
                        ) : authResolved ? (
                          <>
                            <Button asChild variant="ghost" className="w-full">
                              <Link href="/auth/login">{t("login")}</Link>
                            </Button>
                            <Button asChild variant="primary" className="w-full">
                              <Link href="/auth/register">{t("signup")}</Link>
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
