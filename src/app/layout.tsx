import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "小语种资讯站｜行业情报与趋势研究",
  description: "追踪小语种教育平台、产品、价格、课程与市场变化，用可追溯证据帮助行业研究者看懂趋势。",
  openGraph: {
    title: "小语种资讯站｜行业趋势",
    description: "看懂变化，找到证据。追踪小语种教育行业的平台、产品、价格与课程信号。",
    images: ["/og-industry-trends.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "小语种资讯站｜行业趋势",
    description: "看懂变化，找到证据。追踪平台、产品、价格与课程信号。",
    images: ["/og-industry-trends.png"],
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
