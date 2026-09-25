import { Geist, Newsreader, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import config from "@/config";

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: "RealHub - Nền tảng mua bán bất động sản",
  description: "Hệ thống mua bán quản lý bất động sản cho đa người dùng",
  openGraph: {
    url: config.siteUrl,
    siteName: "RealHub",
    title: "RealHub - Nền tảng mua bán bất động sản",
    description: "Hệ thống mua bán quản lý bất động sản cho đa người dùng",
    type: "website",
    locale: 'vi_VN',
    images: [
      {
        url: `${config.siteUrl}/thumbnail-seo.webp`,
        width: 1200,
        height: 630,
        alt: 'RealHub - Nền tảng mua bán bất động sản',
      }
    ],
  },
  alternates: {
    canonical: config.siteUrl,
    languages: {
      vi: `${config.siteUrl}/vi`,
      en: `${config.siteUrl}/en`,
      "x-default": `${config.siteUrl}/vi`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true
    }
  }
};

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-serif-display",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geist.variable} ${newsreader.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
