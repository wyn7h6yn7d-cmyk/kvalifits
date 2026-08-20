import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { getLocale } from "next-intl/server";
import { ConsentedAnalytics } from "@/components/cookies/ConsentedAnalytics";
import { SEO_DEFAULT_LOCALE, SITE_NAME, SITE_ORIGIN } from "@/lib/seo/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  applicationName: SITE_NAME,
  appleWebApp: {
    title: SITE_NAME,
  },
  icons: {
    icon: [
      { url: "/favicon-v4.ico", type: "image/x-icon", sizes: "any" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon-v4.png", type: "image/png", sizes: "128x128" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon-v4.ico"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let locale: string = SEO_DEFAULT_LOCALE;
  try {
    locale = await getLocale();
  } catch {
    // Root layout can render before the locale segment is resolved.
  }
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} h-full font-sans antialiased overflow-x-hidden`}
    >
      <body className="m-0 min-h-[100dvh] overflow-x-hidden bg-background p-0 text-foreground">
        <div className="flex min-h-[100dvh] flex-col">
          {children}
          <ConsentedAnalytics />
        </div>
      </body>
    </html>
  );
}
