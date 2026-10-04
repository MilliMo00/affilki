import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AFFILKI — премия и медиа арбитражного рынка",
    template: "%s — AFFILKI",
  },
  description:
    "AFFILKI Awards — народная премия арбитражного рынка с честным голосованием. Плюс статьи, кейсы и новости от редакции.",
  openGraph: {
    siteName: "AFFILKI",
    locale: "ru_RU",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#30209D",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" suppressHydrationWarning className={`${unbounded.variable} ${onest.variable}`}>
      <body>{children}</body>
    </html>
  );
}
