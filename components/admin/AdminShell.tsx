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
  maxWidthClassName?: string;
}) {
  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <div className={cn("mx-auto w-full px-6 pb-20 pt-8 sm:pt-10", maxWidthClassName ?? "max-w-5xl")}>
          <AdminSubnav />
          <div className="mt-5 rounded-3xl border border-white/[0.10] bg-[#14141a] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)] sm:p-8">
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-white">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm leading-relaxed text-white/60">{subtitle}</p> : null}
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
