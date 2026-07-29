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
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            selectedTag === ''
              ? 'bg-primary text-white'
              : 'bg-muted text-text-secondary hover:bg-primary-light hover:text-primary-dark'
          )}
        >
          全部
        </button>
        {TAG_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onTagChange(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              selectedTag === opt.value
                ? 'bg-primary text-white'
                : 'bg-muted text-text-secondary hover:bg-primary-light hover:text-primary-dark'
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
            'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
            selectedLanguage === 'all'
              ? 'bg-accent text-white'
              : 'bg-muted/60 text-text-secondary hover:bg-primary-light hover:text-primary-dark'
          )}
        >
          全部语种
        </button>
        {LANGUAGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onLanguageChange(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              selectedLanguage === opt.value
                ? 'bg-accent text-white'
                : 'bg-muted/60 text-text-secondary hover:bg-primary-light hover:text-primary-dark'
            )}
          >
            {opt.label}
          </button>
        ))}

        <span className="w-px h-5 bg-border mx-1" />
        <button
          onClick={() => onSortChange(sortBy === 'score' ? 'date' : 'score')}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
            sortBy === 'score'
              ? 'bg-orange-100 text-orange-700'
              : 'bg-muted/60 text-text-secondary hover:bg-primary-light hover:text-primary-dark'
          )}
        >
          {sortBy === 'score' ? '🔥 热度排序' : '🕐 时间排序'}
        </button>
      </div>
    </div>
  );
}
