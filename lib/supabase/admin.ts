import { createClient } from "@supabase/supabase-js";

import { getSupabaseUrl } from "./env";

export function createSupabaseAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY. Add it to your server environment (Vercel + .env.local) to enable server-side application + email flow."
    );
  }
  return createClient(getSupabaseUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

