import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PageTransition from "./components/PageTransition";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Nebula - 你的智能生活记录",
  description: "用 AI 记录生活，与朋友分享专属标签，体验最自然的社交方式",
  keywords: ["笔记", "AI", "社交", "NFC", "生活记录"],
  authors: [{ name: "Nebula Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#007AFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0A84FF" }
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nebula"
  },
  formatDetection: {
    telephone: false
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased">
        <div id="app-root" className="min-h-screen">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </body>
    </html>
  );
}
