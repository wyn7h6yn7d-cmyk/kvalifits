"use client";

import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/routing";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn, errorMessageFromUnknown } from "@/lib/utils";
import {
  SAVED_SEARCH_ALERTS_DELIVERY_ENABLED,
  SAVED_SEARCH_FREQUENCIES,
  normalizeSavedSearchFilters,
  parseSavedSearchFrequency,
  savedSearchToJobsUrl,
  type SavedJobSearchRow,
} from "@/lib/jobs/savedJobSearches";

function asRow(raw: SavedJobSearchRow): SavedJobSearchRow {
  return {
    ...raw,
    filters: normalizeSavedSearchFilters(raw.filters),
    frequency: parseSavedSearchFrequency(raw.frequency),
    name: (raw.name ?? "").toString(),
    query: (raw.query ?? "").toString(),
  };
}

export function SeekerSavedSearchesList({ searches }: { searches: SavedJobSearchRow[] }) {
  const t = useTranslations("savedSearches");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [rows, setRows] = useState(() => searches.map(asRow));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patch(id: string, update: Partial<SavedJobSearchRow>) {
    setBusyId(id);
    setError(null);
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!user) throw new Error(t("notAuthed"));

      const { error: updErr } = await supabase
        .from("saved_job_searches")
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("seeker_user_id", user.id);
      if (updErr) throw updErr;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...update } : r)));
    } catch (e) {
      setError(errorMessageFromUnknown(e, t("saveFailed")));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    setBusyId(id);
    setError(null);
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!user) throw new Error(t("notAuthed"));

      const { error: delErr } = await supabase
        .from("saved_job_searches")
        .delete()
        .eq("id", id)
        .eq("seeker_user_id", user.id);
      if (delErr) throw delErr;
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(errorMessageFromUnknown(e, t("saveFailed")));
    } finally {
      setBusyId(null);
    }
  }

  if (!rows.length) {
    return (
      <EmptyState
        icon={Bell}
        title={t("emptyTitle")}
        description={t("emptyBody")}
        actions={
          <Button asChild variant="primary" size="sm">
            <Link href="/tood">{t("emptyCta")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-white/55">
        {SAVED_SEARCH_ALERTS_DELIVERY_ENABLED ? t("deliveryLiveNote") : t("deliveryPendingNote")}
      </p>
      {error ? (
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {error}
        </div>
      ) : null}
      <ul className="list-none space-y-3 p-0">
        {rows.map((row) => {
          const href = savedSearchToJobsUrl(row);
          const filterLabels = row.filters.map((f) => f.value).filter(Boolean);
          const busy = busyId === row.id;
          return (
            <li key={row.id}>
              <article
                className={cn(
                  "rounded-2xl border border-white/[0.08] bg-[#16161b] p-4 sm:p-5",
                  !row.enabled && "opacity-70",
                )}
              >
                <label className="block">
                  <span className="sr-only">{t("nameLabel")}</span>
                  <Input
                    className="h-10 rounded-xl px-3 text-[15px] font-medium"
                    value={row.name}
                    disabled={busy}
                    maxLength={120}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)),
                      )
                    }
                    onBlur={() => {
                      const trimmed = row.name.trim().slice(0, 120) || t("untitled");
                      if (trimmed !== row.name) {
                        setRows((prev) =>
                          prev.map((r) => (r.id === row.id ? { ...r, name: trimmed } : r)),
                        );
                      }
                      void patch(row.id, { name: trimmed });
                    }}
                  />
                </label>

                <p className="mt-2 text-[13px] leading-relaxed text-white/55">
                  {row.query ? <span className="text-white/70">{row.query}</span> : t("anyQuery")}
                  {filterLabels.length ? ` · ${filterLabels.join(" · ")}` : null}
                  {row.require_public_salary ? ` · ${t("publicSalary")}` : null}
                </p>
                <p className="mt-1 text-[12px] text-white/40">
                  {row.min_match_percent != null
                    ? t("minMatchSummary", { threshold: row.min_match_percent })
                    : t("minMatchNone")}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 text-[13px] text-white/70">
                    <span>{t("frequencyLabel")}</span>
                    <select
                      value={row.frequency}
                      disabled={busy}
                      onChange={(e) => {
                        const frequency = parseSavedSearchFrequency(e.target.value);
                        void patch(row.id, { frequency });
                      }}
                      className="h-9 rounded-xl border border-white/[0.10] bg-white/[0.04] px-2 text-[13px] text-white/85 outline-none"
                    >
                      {SAVED_SEARCH_FREQUENCIES.map((freq) => (
                        <option key={freq} value={freq}>
                          {t(`frequency.${freq}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="inline-flex items-center gap-2 text-[13px] text-white/70">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      disabled={busy}
                      onChange={(e) => void patch(row.id, { enabled: e.target.checked })}
                      className="accent-white"
                    />
                    {row.enabled ? t("enabled") : t("disabled")}
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="h-9 rounded-xl text-[13px]">
                    <Link href={href}>{t("openSearch")}</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-xl text-[13px]"
                    disabled={busy}
                    onClick={() => void remove(row.id)}
                  >
                    {t("delete")}
                  </Button>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
