import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "دلالتي — منصة الدلالات في عدن",
  description:
    "متجرك الخاص برابط واحد، مع تكامل مباشر مع واتساب لإدارة منتجاتك وطلباتك.",
  metadataBase: new URL("https://dalalti.com"),
  openGraph: {
    title: "دلالتي — منصة الدلالات في عدن",
    description: "متجرك الخاص برابط واحد، مع تكامل مباشر مع واتساب لإدارة منتجاتك وطلباتك.",
    siteName: "دلالتي",
    locale: "ar_YE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "دلالتي — منصة الدلالات في عدن",
    description: "متجرك الخاص برابط واحد، مع تكامل مباشر مع واتساب لإدارة منتجاتك وطلباتك.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${plexSansArabic.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-ink font-body">
        {children}
      </body>
    </html>
  );
}
