import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t-4 border-foreground bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr] gap-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 bg-foreground text-background flex items-center justify-center font-serif text-xl border-b-4 border-primary">语</span>
              <strong className="editorial-title text-xl">小语种资讯站</strong>
            </div>
            <p className="text-sm text-text-secondary leading-7 mt-4 max-w-md">
              追踪小语种教育市场、学习平台与考试信息，为行业研究和关键决策提供可信来源。
            </p>
          </div>
          <div>
            <p className="eyebrow mb-4">Research</p>
            <div className="grid gap-2 text-sm">
              <Link href="/competitors" className="hover:text-primary">产品动态</Link>
              <Link href="/insights" className="hover:text-primary">行业趋势</Link>
              <Link href="/reports" className="hover:text-primary">本周观察</Link>
              <Link href="/compare" className="hover:text-primary">竞品对比</Link>
            </div>
          </div>
          <div>
            <p className="eyebrow mb-4">Learning</p>
            <div className="grid gap-2 text-sm">
              <Link href="/articles" className="hover:text-primary">精品文章</Link>
              <Link href="/calendar" className="hover:text-primary">考试日历</Link>
              <span className="text-text-secondary">日语 · 韩语 · 法语 · 德语 · 西语</span>
            </div>
          </div>
        </div>
        <div className="mt-9 pt-4 border-t border-border flex flex-col sm:flex-row justify-between gap-2 text-[11px] text-text-tertiary">
          <span>© {new Date().getFullYear()} 小语种资讯站</span>
          <span>公开信息聚合 · 来源可追溯 · 每日更新</span>
        </div>
      </div>
    </footer>
  );
}
