import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { getLocale } from "next-intl/server";
import { ConsentedAnalytics } from "@/components/cookies/ConsentedAnalytics";
import { SEO_DEFAULT_LOCALE, SITE_NAME } from "@/lib/seo/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kvalifits.ee"),
  applicationName: SITE_NAME,
  appleWebApp: {
    title: SITE_NAME,
  },
  icons: {
    icon: [
      { url: "/favicon-v4.ico", type: "image/x-icon" },
      { url: "/favicon-v4.png", type: "image/png", sizes: "128x128" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
