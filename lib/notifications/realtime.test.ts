import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { subscribeToUserNotificationsRealtime } from "./realtime";

describe("notifications realtime subscription helper", () => {
  it("subscribes to INSERT/UPDATE with a user-scoped filter and cleans up", () => {
    const onCalls: Array<{ event: string; filter: string }> = [];
    let unsubscribed = false;
    const mockChannel = {
      on: (_: string, opts: any, __: any) => {
        if (opts?.event && opts?.filter) onCalls.push({ event: opts.event, filter: opts.filter });
        return mockChannel;
      },
      subscribe: () => mockChannel,
      unsubscribe: () => {
        unsubscribed = true;
      },
    };

    const mockSupabase: any = {
      channel: (_name: string) => mockChannel,
    };

    let eventCount = 0;
    const cleanup = subscribeToUserNotificationsRealtime({
      supabase: mockSupabase,
      userId: "user-1",
      onEvent: () => {
        eventCount += 1;
      },
    });

    assert.equal(eventCount, 0);
    assert.equal(onCalls.length, 2);
    assert.ok(onCalls.some((c) => c.event === "INSERT" && c.filter === "user_id=eq.user-1"));
    assert.ok(onCalls.some((c) => c.event === "UPDATE" && c.filter === "user_id=eq.user-1"));

    cleanup();
    assert.equal(unsubscribed, true);
  });

  it("account change: cleanup old subscription when userId changes", () => {
    const createdFilters: string[] = [];
    const channels = new Map<
      string,
      { state: { cleanedUp: boolean }; channel: { on: any; subscribe: any; unsubscribe: () => void } }
    >();

    function makeMockChannel(channelKey: string) {
      const existing = channels.get(channelKey);
      if (existing) return existing.channel;

      const state = { cleanedUp: false };
      const channel = {
        on: (_: string, opts: any) => {
          if (opts?.filter) createdFilters.push(opts.filter);
          return channel;
        },
        subscribe: () => channel,
        unsubscribe: () => {
          state.cleanedUp = true;
        },
      };

      channels.set(channelKey, { state, channel });
      return channel;
    }

    const mockSupabase: any = {
      channel: (name: string) => makeMockChannel(name),
    };

    const cleanupA = subscribeToUserNotificationsRealtime({
      supabase: mockSupabase,
      userId: "user-a",
      onEvent: () => {},
    });
    const cleanupB = subscribeToUserNotificationsRealtime({
      supabase: mockSupabase,
      userId: "user-b",
      onEvent: () => {},
    });

    cleanupA();
    cleanupB();

    // Filters are user-scoped and should reference both users.
    assert.ok(createdFilters.includes("user_id=eq.user-a"));
    assert.ok(createdFilters.includes("user_id=eq.user-b"));

    // Cleanup/unsubscribe should have been called for both subscriptions.
    assert.equal(channels.get("user-notifications-user-a")?.state.cleanedUp, true);
    assert.equal(channels.get("user-notifications-user-b")?.state.cleanedUp, true);
  });
});

