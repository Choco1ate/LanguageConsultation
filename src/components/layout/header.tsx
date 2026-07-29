'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ThemeToggle from './theme-toggle';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '今日情报' },
  { href: '/competitors', label: '产品动态' },
  { href: '/articles', label: '精品文章' },
  { href: '/insights', label: '趋势研究' },
  { href: '/compare', label: '竞品对比' },
  { href: '/calendar', label: '考试日历' },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-foreground/20 bg-background/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-5">
          <Link href="/" className="flex items-center gap-3 shrink-0" onClick={() => setOpen(false)}>
            <span className="w-9 h-9 bg-foreground text-background flex items-center justify-center font-serif text-xl border-b-4 border-primary">语</span>
            <span>
              <strong className="editorial-title block text-[1.05rem] leading-none">小语种资讯站</strong>
              <small className="hidden sm:block text-[9px] tracking-[.18em] text-text-secondary mt-1">LANGUAGE INTELLIGENCE</small>
            </span>
          </Link>

          <nav className="hidden lg:flex items-stretch self-stretch" aria-label="主导航">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3.5 flex items-center text-[13px] font-semibold border-b-2',
                  active(item.href) ? 'border-primary text-foreground' : 'border-transparent text-text-secondary hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden md:flex items-center gap-2 text-[11px] text-text-secondary mr-2"><span className="status-dot" /> 数据持续更新</span>
            <ThemeToggle />
            <button
              type="button"
              className="lg:hidden w-9 h-9 border border-border bg-card text-lg"
              aria-label="打开导航菜单"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? '×' : '☰'}
            </button>
          </div>
        </div>

        {open && (
          <nav className="lg:hidden border-t border-border py-3 grid grid-cols-2 gap-1" aria-label="移动端导航">
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn('px-3 py-3 text-sm border-l-2', active(item.href) ? 'border-primary bg-primary-light text-primary-dark font-bold' : 'border-transparent text-text-secondary')}
              >
                <span className="text-[10px] text-text-tertiary mr-2">0{index + 1}</span>{item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
