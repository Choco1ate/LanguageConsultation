import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "小语种资讯站 - 行业产品动态与精品文章聚合",
  description: "专注小语种在线教育行业资讯，提供行业产品动态与考级、高考等精品文章聚合服务。覆盖日语、韩语、法语、德语、西班牙语等多语种。",
  openGraph: {
    title: "小语种资讯站",
    description: "竞品情报、考试日历与精品学习内容的一站式小语种资讯门户。",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "小语种资讯站｜行业情报与趋势研究",
    description: "追踪小语种教育市场、产品动态、考试信息与精品内容。",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <Script id="theme-init" strategy="beforeInteractive">{`
          try {
            const t = localStorage.getItem('site-theme') || 'system';
            const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.dataset.theme = dark ? 'dark' : 'light';
          } catch (_) {}
        `}</Script>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
