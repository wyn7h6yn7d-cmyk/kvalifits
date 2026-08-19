import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { GET as healthGet } from "@/app/api/health/route";

describe("health routes", () => {
  it("liveness returns ok without leaking internals", async () => {
    const res = await healthGet();
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { ok: true });
    const text = JSON.stringify(body);
    assert.doesNotMatch(text, /supabase|secret|dsn|postgres/i);
  });
});
