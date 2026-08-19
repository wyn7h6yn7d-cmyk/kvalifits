import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export function ServerPagination({
  page,
  totalPages,
  buildHref,
  labels,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  labels: { prev: string; next: string; status: string };
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {page > 1 ? (
        <Button asChild variant="outline" size="sm">
          <Link href={buildHref(page - 1)}>
            <ChevronLeft className="mr-1 h-3.5 w-3.5" aria-hidden />
            {labels.prev}
          </Link>
        </Button>
      ) : (
        <span />
      )}
      <p className="text-[13px] tabular-nums text-white/50">{labels.status}</p>
      {page < totalPages ? (
        <Button asChild variant="outline" size="sm">
          <Link href={buildHref(page + 1)}>
            {labels.next}
            <ChevronRight className="ml-1 h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      ) : (
        <span />
      )}
    </div>
  );
}
