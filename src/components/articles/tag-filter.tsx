'use client';

import { cn, TAG_OPTIONS, LANGUAGE_OPTIONS } from '@/lib/utils';

interface TagFilterProps {
  selectedTag: string;
  selectedLanguage: string;
  sortBy: string;
  onTagChange: (tag: string) => void;
  onLanguageChange: (language: string) => void;
  onSortChange: (sort: string) => void;
}

export default function TagFilter({
  selectedTag,
  selectedLanguage,
  sortBy,
  onTagChange,
  onLanguageChange,
  onSortChange,
}: TagFilterProps) {
  return (
    <div className="space-y-3">
      {/* Tag filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onTagChange('')}
          className={cn(
            'px-3 py-2 border text-xs font-bold',
            selectedTag === ''
              ? 'bg-primary text-white'
              : 'bg-card border-border text-text-secondary hover:bg-primary-light hover:text-primary-dark'
          )}
        >
          全部
        </button>
        {TAG_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onTagChange(opt.value)}
            className={cn(
              'px-3 py-2 border text-xs font-bold',
              selectedTag === opt.value
                ? 'bg-primary text-white'
                : 'bg-card border-border text-text-secondary hover:bg-primary-light hover:text-primary-dark'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Language + Sort */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onLanguageChange('all')}
          className={cn(
            'px-3 py-2 border text-xs font-medium',
            selectedLanguage === 'all'
              ? 'bg-accent text-white'
              : 'bg-card border-border text-text-secondary hover:bg-primary-light hover:text-primary-dark'
          )}
        >
          全部语种
        </button>
        {LANGUAGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onLanguageChange(opt.value)}
            className={cn(
              'px-3 py-2 border text-xs font-medium',
              selectedLanguage === opt.value
                ? 'bg-accent text-white'
                : 'bg-card border-border text-text-secondary hover:bg-primary-light hover:text-primary-dark'
            )}
          >
            {opt.label}
          </button>
        ))}

        <span className="w-px h-5 bg-border mx-1" />
        <button
          onClick={() => onSortChange(sortBy === 'score' ? 'date' : 'score')}
          className={cn(
            'px-3 py-2 border text-xs font-medium',
            sortBy === 'score'
              ? 'bg-accent-light text-foreground border-accent'
              : 'bg-card border-border text-text-secondary hover:bg-primary-light hover:text-primary-dark'
          )}
        >
          {sortBy === 'score' ? '🔥 热度排序' : '🕐 时间排序'}
        </button>
      </div>
    </div>
  );
}
