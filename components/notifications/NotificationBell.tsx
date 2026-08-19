"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";

import { useCurrentAuth } from "@/components/auth/CurrentAuthProvider";
import { Link } from "@/i18n/routing";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

function isMissingNotificationsTable(message: string | undefined) {
  const m = (message ?? "").toLowerCase();
  return m.includes("notifications") && (m.includes("does not exist") || m.includes("schema cache"));
}

export function NotificationBell() {
  const t = useTranslations("notifications");
  const { authenticated } = useCurrentAuth();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    if (!authenticated) {
      setUnread(0);
      return;
    }
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    if (error) {
      if (!isMissingNotificationsTable(error.message)) {
        setUnread(0);
      }
      return;
    }
    setUnread(count ?? 0);
  }, [authenticated, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  if (!authenticated) return null;

  const label = unread > 0 ? t("bellUnread", { count: unread > 99 ? 99 : unread }) : t("bell");
  const badge = unread > 99 ? "99+" : unread > 0 ? String(unread) : null;

  return (
    <Link
      href="/account/notifications"
      aria-label={label}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white lg:h-8 lg:w-8"
    >
      <Bell className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      {badge ? (
        <span
          className={cn(
            "absolute right-1 top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-semibold leading-4 text-white lg:right-0 lg:top-0",
          )}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
