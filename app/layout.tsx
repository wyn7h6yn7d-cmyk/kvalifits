import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Kvalifits — verifitseeritud oskustega töövahendus",
    template: "%s · Kvalifits",
  },
  description:
    "Tööandjad ja spetsialistid ühes pädevuspõhises süsteemis. Verifitseeritud oskused, selge sobivus.",
  icons: {
    icon: [
      { url: "/favicon-v4.ico", type: "image/x-icon" },
      { url: "/favicon-v4.png", type: "image/png", sizes: "128x128" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  metadataBase: new URL("https://kvalifits.ee"),
  openGraph: {
    title: "Kvalifits — verifitseeritud oskustega töövahendus",
    description:
      "Eesti tööturul: pädevus, sertifikaadid ja sobitamine, mida saab põhjendada.",
    type: "website",
    locale: "et_EE",
  },
  alternates: {
    languages: {
      et: "/",
      en: "/en",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="et"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <div className="min-h-full flex flex-col">{children}</div>
      </body>
    </html>
  );
}
