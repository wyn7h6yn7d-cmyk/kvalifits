export function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    // During Next.js builds, Client Components can be analyzed/prerendered in an
    // environment where runtime env vars aren't present. We defer hard failure
    // to actual runtime in the browser / server request handlers.
    if (typeof window === "undefined") return "";
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. If you just added it, restart the dev server."
    );
  }
  return value;
}

export function getSupabaseAnonKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) {
    if (typeof window === "undefined") return "";
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. If you just added it, restart the dev server."
    );
  }
  return value;
}

