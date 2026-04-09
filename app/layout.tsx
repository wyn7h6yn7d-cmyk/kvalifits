import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
  metadataBase: new URL("https://kvalifits.ee"),
  icons: {
    icon: [
      { url: "/favicon-v4.ico", type: "image/x-icon" },
      { url: "/favicon-v4.png", type: "image/png", sizes: "128x128" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="m-0 min-h-[100dvh] bg-background p-0 text-foreground">
        <div className="flex min-h-[100dvh] flex-col">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
