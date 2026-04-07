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
    "Kvalifits viib kokku tunnustatud tööandjad ja kvalifitseeritud töötajad — verifitseeritud oskused, sertifikaadid ja usaldusväärsed sobivused.",
  icons: {
    icon: [
      { url: "/favicon-v3.ico", type: "image/x-icon" },
      { url: "/favicon-v3.png", type: "image/png", sizes: "128x128" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  metadataBase: new URL("https://kvalifits.ee"),
  openGraph: {
    title: "Kvalifits — verifitseeritud oskustega töövahendus",
    description:
      "Premium tööplatvorm Eesti turule: sertifikaadid, kvalifikatsioonipõhine sobitamine ja usaldus tööandjate ning tööotsijate vahel.",
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
