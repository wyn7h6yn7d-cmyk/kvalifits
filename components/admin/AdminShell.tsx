import type { ReactNode } from "react";

import { AdminSubnav } from "@/components/admin/AdminSubnav";
import { Footer } from "@/components/sections/Footer";
import { Navbar } from "@/components/sections/Navbar";
import { cn } from "@/lib/utils";

export function AdminShell({
  title,
  subtitle,
  children,
  maxWidthClassName,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Narrows the content card only — subnav stays full admin width. */
  maxWidthClassName?: string;
}) {
  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <div className="mx-auto w-full max-w-5xl px-6 pb-20 pt-8 sm:pt-10">
          <AdminSubnav />
          <div
            className={cn(
              "mt-5 rounded-3xl border border-border bg-white p-6 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.16)] sm:p-8",
              maxWidthClassName,
            )}
          >
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p> : null}
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
