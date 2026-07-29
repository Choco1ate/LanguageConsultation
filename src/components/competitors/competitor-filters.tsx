'use client';

import { cn, LANGUAGE_OPTIONS } from '@/lib/utils';

interface CompetitorFiltersProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

export default function CompetitorFilters({
  selectedLanguage,
  onLanguageChange,
}: CompetitorFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onLanguageChange('all')}
        className={cn(
          'px-3 py-2 border text-xs font-bold',
          selectedLanguage === 'all'
            ? 'bg-primary text-white'
            : 'bg-card border-border text-text-secondary hover:bg-primary-light hover:text-primary-dark'
        )}
      >
        全部
      </button>
      {LANGUAGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onLanguageChange(opt.value)}
          className={cn(
            'px-3 py-2 border text-xs font-bold',
            selectedLanguage === opt.value
              ? 'bg-primary text-white'
              : 'bg-card border-border text-text-secondary hover:bg-primary-light hover:text-primary-dark'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
