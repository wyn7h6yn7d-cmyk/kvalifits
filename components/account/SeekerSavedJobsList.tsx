"use client";

import { useState } from "react";
import { Bookmark, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import { JobSaveButton } from "@/components/jobs/JobSaveButton";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatJobDateDdMmYyyy } from "@/lib/jobs/jobLifecycle";
import { cn } from "@/lib/utils";

export type SavedJobListItem = {
  id: string;
  jobPostId: string;
  title: string;
  company: string;
  location: string;
  applicationDeadline: string | null;
  active: boolean;
};

export function SeekerSavedJobsList({ items }: { items: SavedJobListItem[] }) {
  const t = useTranslations("savedJobs");
  const tCard = useTranslations("jobCard");
  const [rows, setRows] = useState(items);

  if (!rows.length) {
    return (
      <EmptyState
        icon={Bookmark}
        title={t("emptyTitle")}
        actions={
          <Button asChild variant="primary" size="sm">
            <Link href="/tood">{t("emptyCta")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="list-none space-y-3 p-0">
      {rows.map((row) => {
        const deadline = formatJobDateDdMmYyyy(row.applicationDeadline);
        const href = `/tood/${row.jobPostId}`;
        return (
          <li key={row.id}>
            <article
              className={cn(
                "relative rounded-2xl border border-border bg-white p-4 sm:p-5",
                !row.active && "opacity-80",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-pretty text-[1.05rem] font-semibold leading-snug tracking-tight text-foreground">
                      {row.title}
                    </h2>
                    {!row.active ? (
                      <span className="inline-flex rounded-md border border-amber-500/25 bg-amber-500/10 px-1.5 py-px text-[10px] font-semibold tracking-wide text-amber-800">
                        {t("inactive")}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted">
                    <span className="truncate font-medium text-body">{row.company}</span>
                    {row.location ? (
                      <>
                        <span className="text-muted-2" aria-hidden>
                          ·
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1 text-muted-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-2" aria-hidden />
                          <span className="truncate">{row.location}</span>
                        </span>
                      </>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-[12px] text-muted-2">
                    {deadline ? `${t("deadline")} ${deadline}` : t("deadlineUnknown")}
                  </p>
                  <div className="mt-3">
                    <Button asChild variant="outline" size="sm" className="h-9 rounded-xl px-3.5 text-[13px]">
                      <Link href={href}>{tCard("openJob")}</Link>
                    </Button>
                  </div>
                </div>
                <JobSaveButton
                  jobId={row.jobPostId}
                  initialSaved
                  onSavedChange={(saved) => {
                    if (!saved) setRows((prev) => prev.filter((r) => r.id !== row.id));
                  }}
                />
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
