import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-background to-primary-light/20 border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">语</span>
              </div>
              <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">小语种资讯站</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              专注小语种在线教育行业资讯，提供行业产品动态与精品文章聚合服务。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">快速导航</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/competitors" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  行业产品动态
                </Link>
              </li>
              <li>
                <Link href="/articles" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  精品文章
                </Link>
              </li>
              <li>
                <Link href="/calendar" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  考试日历
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  竞品对比
                </Link>
              </li>
              <li>
                <Link href="/insights" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  趋势看板
                </Link>
              </li>
            </ul>
          </div>

          {/* Languages */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">覆盖语种</h3>
            <div className="flex flex-wrap gap-2">
              {['日语', '韩语', '法语', '德语', '西班牙语', '英语'].map((lang) => (
                <span
                  key={lang}
                  className="text-xs px-2 py-1 rounded-full bg-primary-light text-primary-dark"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-text-secondary">
            © {new Date().getFullYear()} 小语种资讯站 · 小语种在线教育行业监控与资讯聚合平台
          </p>
        </div>
      </div>
    </footer>
  );
}
