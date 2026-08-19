import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT || 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`;
const startWebServer = !process.env.PLAYWRIGHT_BASE_URL;

const DUMMY_SUPABASE_ANON_KEY = "eyJhbGciOiJub25lIn0.e30.";
const PLACEHOLDER_SUPABASE_URL = "https://example.invalid.supabase.co";

const WEBSERVER_ENV_BLOCKLIST = new Set([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]);

function decodeJwtPayload(jwt: string) {
  const part = jwt.split(".")[1];
  const pad = "=".repeat((4 - (part.length % 4)) % 4);
  return JSON.parse(Buffer.from(part + pad, "base64url").toString("utf8"));
}

function liveSupabaseConfigured(env: NodeJS.ProcessEnv) {
  const anon = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim() || resolveLiveSupabaseUrl(env) || "";
  return Boolean(url && anon && anon !== DUMMY_SUPABASE_ANON_KEY);
}

function liveE2eConfigured(env: NodeJS.ProcessEnv) {
  if (!liveSupabaseConfigured(env)) return false;
  return (
    Boolean(env.E2E_SEEKER_EMAIL && env.E2E_SEEKER_PASSWORD) ||
    Boolean(env.E2E_EMPLOYER_EMAIL && env.E2E_EMPLOYER_PASSWORD) ||
    Boolean(env.E2E_BLOCKED_EMAIL && env.E2E_BLOCKED_PASSWORD) ||
    env.E2E_TEST_FIXTURES === "1"
  );
}

function resolveLiveSupabaseUrl(env: NodeJS.ProcessEnv): string | null {
  const fromEnv = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!serviceKey) return null;
  const ref = decodeJwtPayload(serviceKey).ref;
  return ref ? `https://${ref}.supabase.co` : null;
}

function webServerEnv(): Record<string, string> {
  const env: Record<string, string> = { PORT: String(PORT) };

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string" && !WEBSERVER_ENV_BLOCKLIST.has(key)) {
      env[key] = value;
    }
  }

  if (liveE2eConfigured(process.env)) {
    const liveUrl = resolveLiveSupabaseUrl(process.env);
    if (liveUrl) env.NEXT_PUBLIC_SUPABASE_URL = liveUrl;
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    if (serviceKey) env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
    if (process.env.E2E_TEST_FIXTURES === "1") env.E2E_TEST_FIXTURES = "1";
    if (process.env.E2E_SUPABASE_PROJECT_REF) {
      env.E2E_SUPABASE_PROJECT_REF = process.env.E2E_SUPABASE_PROJECT_REF.trim();
    }
  } else {
    // Deterministic/UI tests: never inherit migration-shell Supabase env into the app server.
    env.NEXT_PUBLIC_SUPABASE_URL = PLACEHOLDER_SUPABASE_URL;
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY = DUMMY_SUPABASE_ANON_KEY;
  }

  env.E2E_HARNESS = "1";
  return env;
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec\.ts/ },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
      testMatch: /mobile\.spec\.ts|quick-apply-a11y\.spec\.ts/,
    },
  ],
  webServer: startWebServer
    ? {
        // Use dev for E2E smoke: deterministic Supabase placeholders and hot paths match local runs.
        // Production output is validated separately via `npm run build` (also in CI).
        command: `npx next dev -H 127.0.0.1 -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: webServerEnv(),
      }
    : undefined,
});
