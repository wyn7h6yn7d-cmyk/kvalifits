import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

function supabaseStorageRemotePattern(): { protocol: "https"; hostname: string; pathname: string } | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname;
    if (!host) return null;
    return { protocol: "https", hostname: host, pathname: "/storage/v1/object/public/**" };
  } catch {
    return null;
  }
}

const supabasePattern = supabaseStorageRemotePattern();

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: supabasePattern ? [supabasePattern] : [],
  },
};

export default withNextIntl(nextConfig);
