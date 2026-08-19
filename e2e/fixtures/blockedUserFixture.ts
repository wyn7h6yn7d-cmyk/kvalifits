import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function decodeJwtPayload(jwt: string): { ref?: string } {
  const part = jwt.split(".")[1];
  const pad = "=".repeat((4 - (part.length % 4)) % 4);
  return JSON.parse(Buffer.from(part + pad, "base64url").toString("utf8"));
}

function resolveSupabaseUrl(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const ref = serviceKey ? decodeJwtPayload(serviceKey).ref : undefined;
  return ref ? `https://${ref}.supabase.co` : "";
}

/**
 * Ephemeral blocked-user fixtures are allowed only when explicitly enabled and
 * the service-role key matches a designated test project ref.
 */
export function e2eTestFixturesAllowed(): boolean {
  if (process.env.E2E_TEST_FIXTURES !== "1") return false;
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const expectedRef = (process.env.E2E_SUPABASE_PROJECT_REF || "").trim();
  if (!serviceKey || !expectedRef) return false;
  try {
    return decodeJwtPayload(serviceKey).ref === expectedRef;
  } catch {
    return false;
  }
}

export function createE2eAdminClient(): SupabaseClient {
  const url = resolveSupabaseUrl();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !serviceKey) {
    throw new Error("Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY for E2E fixtures");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export type EphemeralBlockedUser = {
  userId: string;
  email: string;
  password: string;
};

export async function createEphemeralBlockedUser(admin: SupabaseClient): Promise<EphemeralBlockedUser> {
  const stamp = Date.now().toString(36);
  const email = `e2e-blocked-${stamp}@example.com`;
  const password = `E2eBlocked-${stamp}-Aa1!`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "seeker" },
  });
  if (error || !data.user?.id) {
    throw new Error(`createEphemeralBlockedUser: ${error?.message || "missing user id"}`);
  }

  const userId = data.user.id;
  const { error: profileErr } = await admin.from("profiles").upsert({
    id: userId,
    email,
    role: "seeker",
    is_blocked: true,
  });
  if (profileErr) {
    await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    throw new Error(`createEphemeralBlockedUser profile: ${profileErr.message}`);
  }

  return { userId, email, password };
}

export async function deleteEphemeralUser(admin: SupabaseClient, userId: string): Promise<void> {
  await admin.from("profiles").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);
}
