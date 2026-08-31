import { MapPin } from "lucide-react";

import { Link } from "@/i18n/routing";
import { CompanyLogo } from "@/components/companies/CompanyLogo";
import { CompanyVerifiedBadge } from "@/components/employer/CompanyVerificationBadge";
import type { PublicCompany } from "@/lib/companies/publicCompany";
import { cn } from "@/lib/utils";

export function CompanyCard({
  company,
  verifiedLabel,
}: {
  company: PublicCompany;
  verifiedLabel: string;
}) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/[0.11] bg-[#14141f]",
        "px-4 py-4 shadow-[0_16px_48px_-32px_rgba(0,0,0,0.55)] sm:px-5 sm:py-5",
        "transition-[border-color,background-color,transform] duration-200 ease-out",
        "hover:-translate-y-px hover:border-white/[0.16] hover:bg-[#181824]",
        "motion-reduce:hover:translate-y-0",
      )}
    >
      <Link
        href={`/ettevotted/${company.slug}`}
        className="absolute inset-0 z-0 rounded-xl"
        aria-label={company.name}
      />
      <div className="relative z-[1] flex gap-4">
        <CompanyLogo
          url={company.logoUrl}
          name={company.name}
          className="border-white/[0.10] bg-[#1a1a26] text-foreground/85"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[1.0625rem] font-semibold leading-snug text-foreground sm:text-[1.125rem]">
              {company.name}
            </h2>
            {company.verified ? <CompanyVerifiedBadge label={verifiedLabel} /> : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.9375rem] text-muted sm:text-base">
            {company.location ? (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0 text-muted-2" aria-hidden />
                <span className="truncate">{company.location}</span>
              </span>
            ) : null}
            {company.industry ? <span className="truncate">{company.industry}</span> : null}
          </div>
        </div>
      </div>
    </article>
  );
}
