"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Link } from "@/i18n/routing";
import {
  isNotificationUnread,
  notificationCopyKey,
  notificationHref,
  notificationMarkReadPatch,
  type NotificationRow,
} from "@/lib/notifications/types";
import { dedupeNotificationsById, sortNotificationsByCreatedAtDesc } from "@/lib/notifications/mergeNotifications";
import { subscribeToUserNotificationsRealtime } from "@/lib/notifications/realtime";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn, errorMessageFromUnknown } from "@/lib/utils";

function formatWhen(iso: string, locale: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function NotificationsInbox({
  locale,
  userId,
  initialRows,
}: {
  locale: string;
  userId: string;
  initialRows: NotificationRow[];
}) {
  const t = useTranslations("notifications");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [rows, setRows] = useState(initialRows);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reloadTimerRef = useRef<number | null>(null);

  const unread = rows.filter(isNotificationUnread).length;

  const loadRows = useCallback(async () => {
    const { data, error: loadErr } = await supabase
      .from("notifications")
      .select("id,user_id,type,entity_type,entity_id,payload,created_at,read_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (loadErr) throw loadErr;

    const nextRows = ((data ?? []) as NotificationRow[]).map((row) => ({
      ...row,
      payload: row.payload && typeof row.payload === "object" ? (row.payload as Record<string, unknown>) : {},
    }));

    setRows(sortNotificationsByCreatedAtDesc(dedupeNotificationsById(nextRows)));
  }, [supabase, userId]);

  const scheduleReload = useCallback(() => {
    if (reloadTimerRef.current) window.clearTimeout(reloadTimerRef.current);
    reloadTimerRef.current = window.setTimeout(() => {
      reloadTimerRef.current = null;
      void loadRows().catch((err) => {
        setError(errorMessageFromUnknown(err, t("unknownError")));
      });
    }, 200);
  }, [loadRows, t]);

  async function markRead(ids: string[]) {
    if (!ids.length) return;
    setBusy(true);
    setError(null);
    const patch = notificationMarkReadPatch();
    try {
      const { error: updErr } = await supabase.from("notifications").update(patch).in("id", ids);
      if (updErr) throw updErr;
      setRows((prev) => prev.map((row) => (ids.includes(row.id) ? { ...row, read_at: patch.read_at } : row)));
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setBusy(false);
    }
  }

  async function onOpen(row: NotificationRow) {
    if (isNotificationUnread(row)) {
      await markRead([row.id]);
    }
  }

  useEffect(() => {
    void loadRows().catch((err) => {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    });

    const onFocus = () => scheduleReload();
    window.addEventListener("focus", onFocus);
    return () => {
      if (reloadTimerRef.current) window.clearTimeout(reloadTimerRef.current);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadRows, scheduleReload, t]);

  useEffect(() => {
    const cleanup = subscribeToUserNotificationsRealtime({
      supabase,
      userId,
      onEvent: () => scheduleReload(),
    });
    return cleanup;
  }, [scheduleReload, supabase, userId]);

  if (!rows.length) {
    return (
      <EmptyState
        icon={Bell}
        title={t("emptyTitle")}
        description={t("emptyBody")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/55">
          {unread > 0 ? t("unreadCount", { count: unread }) : t("allRead")}
        </p>
        {unread > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void markRead(rows.filter(isNotificationUnread).map((r) => r.id))}
          >
            {t("markAllRead")}
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {error}
        </div>
      ) : null}

      <ul className="space-y-2">
        {rows.map((row) => {
          const copy = notificationCopyKey(row);
          const href = notificationHref(row);
          const unreadRow = isNotificationUnread(row);
          const title = t(copy.titleKey);
          const body = copy.bodyKey ? t(copy.bodyKey, copy.bodyValues) : null;
          const inner = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white/88">{title}</div>
                  {body ? <p className="mt-1 text-sm leading-relaxed text-white/55">{body}</p> : null}
                  <p className="mt-1.5 text-xs text-white/40">{formatWhen(row.created_at, locale)}</p>
                </div>
                {unreadRow ? (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-fuchsia-400" aria-hidden />
                ) : null}
              </div>
            </>
          );

          return (
            <li key={row.id}>
              {href ? (
                <Link
                  href={href}
                  onClick={() => void onOpen(row)}
                  className={cn(
                    "block rounded-2xl border px-4 py-3.5 transition-colors",
                    unreadRow
                      ? "border-white/[0.14] bg-white/[0.05] hover:bg-white/[0.07]"
                      : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]",
                  )}
                >
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void markRead([row.id])}
                  className={cn(
                    "block w-full rounded-2xl border px-4 py-3.5 text-left transition-colors",
                    unreadRow
                      ? "border-white/[0.14] bg-white/[0.05]"
                      : "border-white/[0.08] bg-white/[0.02]",
                  )}
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
