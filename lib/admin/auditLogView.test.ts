import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { ADMIN_AUDIT_ACTIONS } from "./auditLog.ts";
import {
  ADMIN_AUDIT_PAGE_SIZE,
  ADMIN_AUDIT_PATH,
  adminAuditQuerySpec,
  adminAuditTotalPages,
  buildAdminAuditLogUrl,
  formatAuditSummaryLine,
  parseAdminAuditParams,
  shortenAuditId,
  summarizeAuditDetails,
} from "./auditLogView.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("admin audit log viewer", () => {
  it("parses filters and omits page 1 from the URL", () => {
    const parsed = parseAdminAuditParams({
      action: ADMIN_AUDIT_ACTIONS.userBlock,
      actor: " admin@kvalifits.ee ",
      type: "user",
      from: "2026-08-01",
      to: "2026-08-19",
      page: "3",
    });
    assert.deepEqual(parsed, {
      action: "user.block",
      actor: "admin@kvalifits.ee",
      targetType: "user",
      from: "2026-08-01",
      to: "2026-08-19",
      page: 3,
    });

    const url = buildAdminAuditLogUrl(parsed);
    assert.equal(
      url,
      `${ADMIN_AUDIT_PATH}?action=user.block&actor=admin%40kvalifits.ee&type=user&from=2026-08-01&to=2026-08-19&page=3`,
    );
    assert.equal(buildAdminAuditLogUrl({ ...parsed, page: 1 }), url.replace("&page=3", ""));
  });

  it("clamps pagination and maps date range to inclusive UTC bounds", () => {
    const spec = adminAuditQuerySpec({
      action: null,
      actor: null,
      targetType: "job_post",
      from: "2026-08-01",
      to: "2026-08-19",
      page: 0,
    });
    assert.equal(spec.page, 1);
    assert.equal(spec.pageSize, ADMIN_AUDIT_PAGE_SIZE);
    assert.equal(spec.rangeFrom, 0);
    assert.equal(spec.rangeTo, ADMIN_AUDIT_PAGE_SIZE - 1);
    assert.equal(spec.targetType, "job_post");
    assert.equal(spec.timestampGte, "2026-08-01T00:00:00.000Z");
    assert.equal(spec.timestampLt, "2026-08-20T00:00:00.000Z");

    const page3 = adminAuditQuerySpec({
      action: null,
      actor: null,
      targetType: null,
      from: null,
      to: null,
      page: 3,
    });
    assert.equal(page3.rangeFrom, ADMIN_AUDIT_PAGE_SIZE * 2);
    assert.equal(page3.rangeTo, ADMIN_AUDIT_PAGE_SIZE * 3 - 1);
    assert.equal(adminAuditTotalPages(0), 1);
    assert.equal(adminAuditTotalPages(ADMIN_AUDIT_PAGE_SIZE), 1);
    assert.equal(adminAuditTotalPages(ADMIN_AUDIT_PAGE_SIZE + 1), 2);
  });

  it("drops invalid filter values", () => {
    const parsed = parseAdminAuditParams({
      action: "drop table",
      type: "seeker_profile",
      from: "19-08-2026",
      to: "2026-02-30",
      page: "-4",
    });
    assert.equal(parsed.action, null);
    assert.equal(parsed.targetType, null);
    assert.equal(parsed.from, null);
    assert.equal(parsed.to, null);
    assert.equal(parsed.page, 1);
  });

  it("summarizes safe metadata and omits secrets and document contents", () => {
    const pairs = summarizeAuditDetails({
      reason: "spam listing",
      report_id: "rep-1",
      job_status: "published",
      email: "seeker@example.ee",
      password: "hunter2",
      access_token: "secret-token",
      cv: "CV body text that must never appear",
      cover_letter: "private cover letter",
      certificate_image_url: "https://example/cert.png",
      html: "<p>document</p>",
      nested: { noteForEmployer: "private" },
      document: "-----BEGIN PRIVATE KEY-----\nabc\n",
    });
    const line = formatAuditSummaryLine(pairs);
    assert.match(line, /reason=spam listing/);
    assert.match(line, /report_id=rep-1/);
    assert.match(line, /job_status=published/);
    assert.doesNotMatch(line, /seeker@example\.ee/);
    assert.doesNotMatch(line, /hunter2/);
    assert.doesNotMatch(line, /secret-token/);
    assert.doesNotMatch(line, /CV body/);
    assert.doesNotMatch(line, /cover letter/);
    assert.doesNotMatch(line, /cert\.png/);
    assert.doesNotMatch(line, /<p>/);
    assert.doesNotMatch(line, /PRIVATE KEY/);
    assert.doesNotMatch(line, /private/);
    assert.doesNotMatch(line, /\[Filtered\]/);
  });

  it("shortens long target identifiers", () => {
    assert.equal(shortenAuditId("abc"), "abc");
    assert.equal(
      shortenAuditId("11111111-2222-4333-8444-555555555555"),
      "11111111…5555",
    );
  });

  it("keeps the audit page read-only and admin-gated", () => {
    const page = readFileSync(join(root, "app/[locale]/admin/audit/page.tsx"), "utf8");
    const view = readFileSync(join(root, "components/admin/AdminAuditLogView.tsx"), "utf8");
    const load = readFileSync(join(root, "lib/admin/loadAdminAuditLog.ts"), "utf8");
    assert.match(page, /requireAdmin/);
    assert.doesNotMatch(page, /createSupabaseAdminClient/);
    assert.doesNotMatch(load, /createSupabaseAdminClient/);
    for (const src of [page, view, load]) {
      assert.doesNotMatch(src, /\.update\(/);
      assert.doesNotMatch(src, /\.delete\(/);
      assert.doesNotMatch(src, /\.insert\(/);
    }
    assert.doesNotMatch(view, /method=["']post["']/i);
    assert.match(load, /count:\s*"exact"/);
    assert.match(load, /\.range\(/);
  });
});
