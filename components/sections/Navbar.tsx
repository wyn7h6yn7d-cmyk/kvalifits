"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Menu } from "lucide-react";

import { SeekerBottomNav } from "@/components/navigation/SeekerBottomNav";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/routing";
import {
  resolveDesktopNavItems,
  resolveMobileNavItems,
  type NavItem,
} from "@/lib/navigation/navConfig";
import { cn } from "@/lib/utils";
import { useCurrentAuth } from "@/components/auth/CurrentAuthProvider";

const langTriggerNavbar =
  "h-11 min-h-11 w-auto shrink-0 rounded-md border-0 bg-transparent px-2.5 py-0 text-[13px] leading-none shadow-none ring-0 hover:!bg-white/[0.06] lg:!h-8 lg:!min-h-0 lg:px-2 lg:text-[12px]";

function navIsActive(pathname: string, href: string) {
  if (href === "/tood") return pathname === "/tood" || pathname.startsWith("/tood/");
  if (href === "/account/seeker") return pathname === "/account/seeker";
  if (href === "/account/employer") return pathname === "/account/employer";
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  children,
  active,
  className,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-md px-2 text-[12px] font-medium leading-none transition-colors xl:px-2.5 xl:text-[13px]",
        active ? "bg-white/[0.08] text-white" : "text-white/68 hover:bg-white/[0.05] hover:text-white",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function DesktopNav({ items, pathname, t }: { items: NavItem[]; pathname: string; t: (key: string) => string }) {
  return (
    <nav
      className="hidden min-w-0 flex-1 items-center justify-center gap-0 overflow-x-auto lg:flex xl:gap-0.5"
      aria-label={t("menu")}
    >
      {items.map((item) => (
        <NavLink key={`${item.href}-${item.key}`} href={item.href} active={navIsActive(pathname, item.href)}>
          {t(item.key)}
        </NavLink>
      ))}
    </nav>
  );
}

function MobileNavLinks({
  items,
  pathname,
  t,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  t: (key: string) => string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <Link
          key={`${item.href}-${item.key}`}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center rounded-lg border px-4 py-3.5 text-[15px] transition-colors min-h-11",
            navIsActive(pathname, item.href)
              ? "border-white/[0.14] bg-white/[0.08] text-white"
              : "border-white/[0.08] bg-white/[0.03] text-white/82 hover:bg-white/[0.06]",
          )}
        >
          {t(item.key)}
        </Link>
      ))}
    </div>
  );
}

export function Navbar() {
  const t = useTranslations("nav");
  const tLang = useTranslations("language");
  const locale = useLocale();
  const pathname = usePathname();
  const { authenticated, role } = useCurrentAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const syncBottomOffset = () => {
      const mobile = window.matchMedia("(max-width: 1023px)").matches;
      const show = authenticated && role === "seeker" && mobile;
      document.documentElement.style.setProperty(
        "--site-bottom-nav-offset",
        show ? "calc(var(--site-bottom-nav-height) + env(safe-area-inset-bottom, 0px))" : "0px",
      );
    };

    syncBottomOffset();
    window.addEventListener("resize", syncBottomOffset);
    return () => {
      window.removeEventListener("resize", syncBottomOffset);
      document.documentElement.style.setProperty("--site-bottom-nav-offset", "0px");
    };
  }, [authenticated, role]);

  const desktopNavPaths = resolveDesktopNavItems(pathname, authenticated, role);

  const mobileNavPaths = resolveMobileNavItems(pathname, authenticated, role);

  const showSeekerBottomNav = authenticated && role === "seeker";

  const headerBar = cn(
    "flex h-[var(--site-header-bar)] w-full min-w-0 items-center gap-2 border-b px-4 sm:gap-3 lg:px-5",
    "border-white/[0.08] bg-[#09090d]",
    "lg:overflow-x-clip lg:rounded-[18px] lg:border lg:border-white/[0.10] lg:bg-[#111116] lg:shadow-[0_10px_28px_-18px_rgba(0,0,0,0.62)]",
    scrolled && "border-white/[0.10] lg:border-white/[0.12] lg:bg-[#131318]",
  );

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 pb-[var(--site-header-tail)] pt-[var(--site-header-top)]">
        <div className="pointer-events-auto mx-auto w-full max-w-[1240px] px-4 md:px-6 lg:px-8">
          <div className={headerBar}>
            <div className="flex h-full min-w-0 flex-1 items-center overflow-hidden lg:flex-none lg:shrink-0">
              <Logo
                className="inline-flex h-full max-w-full items-center"
                imageClassName="h-8 w-[7.75rem] object-cover object-left sm:h-9 sm:w-[10.5rem] lg:h-[3.35rem] lg:w-[16.5rem] lg:object-center"
                priority
              />
            </div>

            <DesktopNav items={desktopNavPaths} pathname={pathname} t={t} />

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
              <NotificationBell />
              <div className="hidden items-center gap-1.5 lg:flex">
                <LanguageSwitcher triggerClassName={langTriggerNavbar} />

                {authenticated ? (
                  <>
                    {role === "employer" ? (
                      <Button asChild variant="primary" size="sm">
                        <Link href="/account/employer/jobs/new">{t("addJob")}</Link>
                      </Button>
                    ) : null}
                    {role === null ? (
                      <Link
                        href="/account"
                        className="inline-flex h-8 items-center px-2 text-[13px] font-medium text-white/75 hover:text-white"
                      >
                        {t("account")}
                      </Link>
                    ) : null}
                    <form action={`/${locale}/auth/logout`} method="post">
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center px-2 text-[13px] font-medium text-white/75 transition-colors hover:text-white"
                      >
                        {t("logout")}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="inline-flex h-8 items-center px-2 text-[13px] font-medium text-white/75 hover:text-white"
                    >
                      {t("login")}
                    </Link>
                    <Button asChild variant="primary" size="sm">
                      <Link href="/auth/register">{t("signup")}</Link>
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 lg:hidden">
                <LanguageSwitcher triggerClassName={langTriggerNavbar} />
                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={t("openMenu")}
                    >
                      <Menu aria-hidden />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetTitle className="pr-12">{t("menu")}</SheetTitle>
                    <div className="mt-6 space-y-6">
                      <MobileNavLinks
                        items={mobileNavPaths}
                        pathname={pathname}
                        t={t}
                        onNavigate={() => setMenuOpen(false)}
                      />

                      <div className="border-t border-white/[0.08] pt-4">
                        <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-white/45">
                          {tLang("label")}
                        </div>
                        <LanguageSwitcher className="w-full" triggerClassName="h-11 min-h-11 justify-start px-4 text-[14px]" />
                      </div>

                      <div className="flex flex-col gap-2 border-t border-white/[0.08] pt-4">
                        {authenticated ? (
                          <>
                            {role === "employer" ? (
                              <Button asChild variant="primary" className="w-full">
                                <Link href="/account/employer/jobs/new" onClick={() => setMenuOpen(false)}>
                                  {t("addJob")}
                                </Link>
                              </Button>
                            ) : null}
                            <form action={`/${locale}/auth/logout`} method="post">
                              <Button variant="outline" className="w-full" type="submit">
                                {t("logout")}
                              </Button>
                            </form>
                          </>
                        ) : (
                          <>
                            <Button asChild variant="ghost" className="w-full">
                              <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                                {t("login")}
                              </Link>
                            </Button>
                            <Button asChild variant="primary" className="w-full">
                              <Link href="/auth/register" onClick={() => setMenuOpen(false)}>
                                {t("signup")}
                              </Link>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>

      {showSeekerBottomNav ? <SeekerBottomNav /> : null}
    </>
  );
}
