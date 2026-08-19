import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkTsFiles(full));
      continue;
    }
    if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

function source(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

const GET_USER = /supabase\.auth\.getUser\s*\(/;
const DIRECT_GET_USER = /\.auth\.getUser\s*\(/;

describe("account auth reads use the shared cached getUser", () => {
  it("caches getAuthUser / getCurrentAuth and routes role resolution through them", () => {
    const currentAuth = source("lib/auth/currentAuth.ts");
    const flow = source("lib/onboarding/flow.ts");
    const accountLayout = source("app/[locale]/account/layout.tsx");
    const localeLayout = source("app/[locale]/layout.tsx");
    const requireAccount = source("lib/auth/requireActiveAccountPage.ts");
    const requireAdmin = source("lib/admin/requireAdmin.ts");

    assert.match(currentAuth, /export const getAuthUser = cache\(/);
    assert.match(currentAuth, /await supabase\.auth\.getUser\(\)/);
    assert.match(currentAuth, /export const getCurrentAuth = cache\(/);
    assert.match(currentAuth, /const user = await getAuthUser\(\)/);

    assert.match(flow, /export const getRoleAndNextPath = cache\(/);
    assert.match(flow, /const user = await getAuthUser\(\)/);
    assert.equal(GET_USER.test(flow), false, "getRoleAndNextPath must not call getUser directly");

    assert.match(localeLayout, /getCurrentAuth\(\)/);
    assert.match(accountLayout, /requireActiveAccountPage/);
    assert.match(requireAccount, /getCurrentAuth\(\)/);
    assert.match(requireAdmin, /getAuthUser\(\)/);
    assert.equal(DIRECT_GET_USER.test(requireAdmin), false);
  });

  it("drops uncached getUser from account and admin pages", () => {
    const accountFiles = walkTsFiles(join(root, "app/[locale]/account"));
    const adminFiles = walkTsFiles(join(root, "app/[locale]/admin"));
    assert.ok(accountFiles.length > 5, "expected account route files");
    assert.ok(adminFiles.length > 2, "expected admin route files");

    for (const file of [...accountFiles, ...adminFiles]) {
      const src = readFileSync(file, "utf8");
      assert.equal(DIRECT_GET_USER.test(src), false, `${file} still calls auth.getUser()`);
    }
  });

  it("keeps guest / role / admin gates on the server helpers, not client auth", () => {
    const requireAccount = source("lib/auth/requireActiveAccountPage.ts");
    const flow = source("lib/onboarding/flow.ts");
    const requireAdmin = source("lib/admin/requireAdmin.ts");

    assert.match(requireAccount, /redirect\(`\/\$\{locale\}\/auth\/login`\)/);
    assert.match(requireAccount, /redirect\(`\/\$\{locale\}\/blocked`\)/);
    assert.match(flow, /nextPath: `\/\$\{locale\}\/auth\/login`/);
    assert.match(requireAdmin, /if \(role !== "admin"\) redirect\(`\/\$\{locale\}\/account`\)/);
  });

  it("measures a typical authenticated account request as one getUser", () => {
    // Locale layout: getCurrentAuth → getAuthUser (1 Auth getUser).
    // Account layout: requireActiveAccountPage → getCurrentAuth (same cache).
    // Account page: getRoleAndNextPath → getAuthUser (same cache).
    // Before this change, pages also called supabase.auth.getUser() uncached (2 calls).
    const currentAuth = source("lib/auth/currentAuth.ts");
    const getUserWrites = currentAuth.match(/supabase\.auth\.getUser\(\)/g) ?? [];
    assert.equal(getUserWrites.length, 1);

    const accountPages = walkTsFiles(join(root, "app/[locale]/account")).filter((f) =>
      f.endsWith("page.tsx"),
    );
    const pagesUsingRoleHelper = accountPages.filter((f) =>
      readFileSync(f, "utf8").includes("getRoleAndNextPath"),
    );
    // Redirect-only stubs (e.g. legacy notifications) may not resolve identity.
    assert.ok(pagesUsingRoleHelper.length >= 10);

    const remainingDirect = accountPages.filter((f) => DIRECT_GET_USER.test(readFileSync(f, "utf8")));
    assert.deepEqual(remainingDirect, []);
  });
});
