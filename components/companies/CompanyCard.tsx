import { MapPin } from "lucide-react";

import { Link } from "@/i18n/routing";
import { CompanyLogo } from "@/components/companies/CompanyLogo";
import { CompanyVerifiedBadge } from "@/components/employer/CompanyVerificationBadge";
import type { PublicCompany } from "@/lib/companies/publicCompany";
import {
  SITE_CARD_PADDING,
  SITE_CARD_SURFACE,
} from "@/lib/site/publicPageLayout";
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
        SITE_CARD_SURFACE,
        SITE_CARD_PADDING,
        "relative overflow-hidden transition-[border-color,background-color] hover:border-border-strong hover:bg-[#f5f7fb]",
      )}
    >
      <Link
        href={`/ettevotted/${company.slug}`}
        className="absolute inset-0 z-0 rounded-xl"
        aria-label={company.name}
      />
      <div className="relative z-[1] flex gap-3.5">
        <CompanyLogo url={company.logoUrl} name={company.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[1.0625rem] font-semibold leading-snug text-foreground">{company.name}</h2>
            {company.verified ? <CompanyVerifiedBadge label={verifiedLabel} /> : null}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[0.9375rem] text-muted">
            {company.location ? (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-2" aria-hidden />
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
