function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    // During Next.js builds, Client Components can be analyzed/prerendered in an
    // environment where runtime env vars aren't present. We defer hard failure
    // to actual runtime in the browser / server request handlers.
    if (typeof window === "undefined") return "";
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseUrl() {
  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

