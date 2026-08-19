# Notifications: realtime unread + inbox updates

## Current notification UI

- `app/[locale]/account/notifications/page.tsx` does the **initial server fetch**:
  - selects from `public.notifications`
  - filters to `user_id = auth user`
  - orders by `created_at DESC`
  - limits to the first 100 rows
- `components/notifications/NotificationsInbox.tsx` renders the inbox list from `initialRows`.
- `components/notifications/NotificationBell.tsx` shows the unread count in the navbar.

## What changed: realtime updates

When the user is authenticated, we now subscribe to **Supabase Realtime** events for:

- `public.notifications` **INSERT** (new notification)
- `public.notifications` **UPDATE** (including `read_at` changes when marking read)

Only events for the **current user** are delivered by using a Realtime filter:

- `filter: user_id=eq.<current_user_id>`

On receiving an event, the UI performs a safe refresh:

### Navbar bell

- `NotificationBell` refetches the unread count using:
  - `select count(*)` with `read_at is null`
  - also filters to `user_id = <current_user_id>` (in addition to RLS)

### Inbox list

- `NotificationsInbox` refetches the newest 100 notifications for the user:
  - same `select` columns as the initial server fetch
  - dedupes by `notification.id`
  - replaces local state so duplicates caused by:
    - server initial load
    - realtime INSERT/UPDATE
    - connection retries
    - window focus fallback
    do not result in duplicated list rows.

## Fallback behavior

- The bell already had a `window.focus` refresh; it remains as a fallback.
- The inbox also refreshes on focus (debounced) as a secondary safety net.
- If Realtime subscription fails (e.g. missing Supabase Realtime config), the UI still works via focus refresh and user actions.

## Security model (RLS)

`public.notifications` is protected by RLS:

- owners can `SELECT` their own rows
- owners can `UPDATE(read_at)` on their own rows
- service/trigger logic inserts notifications

The realtime subscription is additionally constrained by a Realtime filter (`user_id=eq.<id>`), but **RLS is the final authority**.

Realtime callbacks never consume the raw event payload; instead the client refetches only the columns the existing notification UI already uses.
That prevents accidental rendering of unrelated/private data.

## Remote configuration required (Supabase)

Realtime must be enabled and working for `public.notifications`.

Exact requirements to verify in the Supabase project:

1. Realtime must be enabled for the table `public.notifications` (Postgres changes publication).
2. The Supabase project must have Realtime/replication available (Supabase-managed infra in most projects).
3. RLS must remain enabled for `public.notifications` so the client can only see/update its own rows.

We do **not** assume Realtime is operational until verified in the target environment.

## Files involved

- `app/[locale]/account/notifications/page.tsx` (initial server fetch)
- `components/notifications/NotificationBell.tsx` (unread realtime count)
- `components/notifications/NotificationsInbox.tsx` (inbox list realtime refresh)
- `lib/notifications/realtime.ts` (user-scoped realtime subscription helper)
- `lib/notifications/mergeNotifications.ts` (dedupe helpers)

