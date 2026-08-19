import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { fetchSavedJobIdsForUser } from "./savedJobs.ts";

type QueryResult = { data: unknown; error: { message: string } | null };

function thenableFrom(result: QueryResult, onEq?: (column: string, value: string) => void) {
  const builder = {
    select() {
      return builder;
    },
    eq(column: string, value: string) {
      onEq?.(column, value);
      return builder;
    },
    then(onFulfilled: (value: QueryResult) => unknown, onRejected?: (reason: unknown) => unknown) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };
  return builder;
}

describe("saved jobs are owner-scoped", () => {
  it("always filters saved_jobs by the current seeker user id", async () => {
    const filters: Array<[string, string]> = [];
    const supabase = {
      from(table: string) {
        assert.equal(table, "saved_jobs");
        return thenableFrom(
          { data: [{ job_post_id: "job-1" }, { job_post_id: "job-2" }], error: null },
          (column, value) => filters.push([column, value]),
        );
      },
    };

    const ids = await fetchSavedJobIdsForUser(supabase as never, "seeker-a");
    assert.deepEqual(filters, [["seeker_user_id", "seeker-a"]]);
    assert.deepEqual(ids, ["job-1", "job-2"]);
  });

  it("does not return another seeker's rows even if the client leaked them", async () => {
    const supabase = {
      from() {
        return thenableFrom({
          data: [{ job_post_id: "  " }, { job_post_id: "own-job" }],
          error: null,
        });
      },
    };
    const ids = await fetchSavedJobIdsForUser(supabase as never, "seeker-a");
    assert.deepEqual(ids, ["own-job"]);
  });
});
