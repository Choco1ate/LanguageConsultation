'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem('site-theme') as Theme | null) || 'system';
    queueMicrotask(() => setTheme(saved));
    applyTheme(saved);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => saved === 'system' && applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const select = (value: Theme) => {
    setTheme(value);
    localStorage.setItem('site-theme', value);
    applyTheme(value);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="切换颜色主题"
        aria-expanded={open}
        className="w-9 h-9 border border-border bg-card hover:border-foreground flex items-center justify-center text-sm"
      >
        {theme === 'dark' ? '◐' : theme === 'light' ? '☀' : '◑'}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-32 border border-border bg-card shadow-xl p-1">
          {([['light', '明亮'], ['dark', '暗色'], ['system', '跟随系统']] as [Theme, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => select(value)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-muted ${theme === value ? 'text-primary font-bold' : 'text-text-secondary'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
