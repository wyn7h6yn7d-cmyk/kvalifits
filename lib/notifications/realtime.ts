import type { SupabaseClient } from "@supabase/supabase-js";

import { reportException } from "@/lib/monitoring/report";

export type NotificationsRealtimeEvent = "INSERT" | "UPDATE";

type SubscribeParams = {
  supabase: Pick<SupabaseClient, "channel" | "removeChannel">;
  userId: string;
  onEvent: (event: NotificationsRealtimeEvent) => void;
};

/**
 * User-scoped Realtime subscription for `public.notifications`.
 *
 * SECURITY:
 * - RLS must still allow SELECT/UPDATE on only `user_id = auth.uid()`.
 * - We also apply a Realtime filter (`user_id=eq.<id>`) to limit event delivery.
 *
 * Return value is a cleanup function that must be called on unmount/logout.
 */
export function subscribeToUserNotificationsRealtime({
  supabase,
  userId,
  onEvent,
}: SubscribeParams): () => void {
  // Avoid leaking the actual user id into monitoring tags/extras.
  const filter = `user_id=eq.${userId}`;
  const channelName = `user-notifications-${userId}`;

  type NotificationsChannel = {
    on: (...args: unknown[]) => NotificationsChannel;
    subscribe: () => NotificationsChannel;
    unsubscribe?: () => void;
  };

  let channel: NotificationsChannel | null = null;
  try {
    channel = supabase.channel(channelName) as unknown as NotificationsChannel;

    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter },
        () => {
          try {
            onEvent("INSERT");
          } catch (err) {
            reportException(err, {
              area: "client",
              code: "notifications_realtime_insert_callback_error",
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter },
        () => {
          try {
            onEvent("UPDATE");
          } catch (err) {
            reportException(err, {
              area: "client",
              code: "notifications_realtime_update_callback_error",
            });
          }
        },
      )
      .subscribe();
  } catch (err) {
    reportException(err, { area: "client", code: "notifications_realtime_subscribe_failed" });
    return () => {};
  }

  return () => {
    try {
      channel?.unsubscribe?.();
    } catch {
      // ignore
    }
  };
}

