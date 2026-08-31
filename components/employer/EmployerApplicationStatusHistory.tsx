"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import {
  formatPipelineTimestamp,
  isApplicationPipelineStatus,
  isImportantPipelineStatus,
  type ApplicationPipelineStatus,
} from "@/lib/employer/applicationPipeline";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type EventRow = {
  id: string;
  from_status: string | null;
  to_status: string;
  created_at: string;
};

export function EmployerApplicationStatusHistory({
  locale,
  applicationId,
  refreshKey,
  className,
}: {
  locale: string;
  applicationId: string;
  refreshKey?: string | null;
  className?: string;
}) {
  const t = useTranslations("jobs");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("job_application_status_events")
        .select("id,from_status,to_status,created_at")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false })
        .limit(12);
      if (cancelled) return;
      if (error) {
        if (/does not exist|schema cache|relation|could not find/i.test(error.message ?? "")) {
          setHidden(true);
          return;
        }
        setEvents([]);
        return;
      }
      setHidden(false);
      setEvents((data ?? []) as EventRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationId, refreshKey, supabase]);

  if (hidden || events === null) return null;

  function label(raw: string | null | undefined) {
    if (!raw) return t("applicationStatusHistoryOpened");
    const v = raw.toLowerCase();
    if (isApplicationPipelineStatus(v)) return t(`applicationPipelineStatus.${v}`);
    return raw;
  }

  return (
    <section className={className}>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-2">
        {t("applicationStatusHistoryTitle")}
      </h3>
      {events.length === 0 ? (
        <p className="mt-1.5 text-sm text-muted-2">{t("applicationStatusHistoryEmpty")}</p>
      ) : (
        <ol className="mt-2 space-y-2">
          {events.map((e) => {
            const to = e.to_status.toLowerCase();
            const important = isApplicationPipelineStatus(to) && isImportantPipelineStatus(to as ApplicationPipelineStatus);
            return (
              <li key={e.id} className="flex items-start justify-between gap-3 text-[13px]">
                <div className={cn("min-w-0", important ? "text-foreground/80" : "text-muted")}>
                  {e.from_status
                    ? t("applicationStatusHistoryChange", {
                        from: label(e.from_status),
                        to: label(e.to_status),
                      })
                    : label(e.to_status)}
                </div>
                <div className="shrink-0 tabular-nums text-[11px] text-muted-2">
                  {formatPipelineTimestamp(locale, e.created_at)}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
