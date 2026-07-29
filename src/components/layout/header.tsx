'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/competitors', label: '行业产品动态' },
  { href: '/articles', label: '精品文章' },
  { href: '/calendar', label: '考试日历' },
  { href: '/insights', label: '趋势看板' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-border shadow-sm shadow-[var(--shadow-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">语</span>
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">小语种资讯站</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary-light/80 text-primary-dark shadow-sm'
                    : 'text-text-secondary hover:text-primary hover:bg-primary-light/40'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Link
              href="/calendar"
              className="text-sm text-text-secondary hover:text-primary px-3 py-1.5 rounded-md hover:bg-primary-light transition-colors"
            >
              考试
            </Link>
            <Link
              href="/insights"
              className="text-sm text-text-secondary hover:text-primary px-3 py-1.5 rounded-md hover:bg-primary-light transition-colors"
            >
              趋势
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
