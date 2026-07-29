import Link from 'next/link';
import { formatDate, LANGUAGE_MAP } from '@/lib/utils';

interface CompetitorCardProps {
  id: string;
  name: string;
  language: string;
  type: string;
  url: string;
  description: string;
  latest_update_title: string | null;
  latest_update_date: string | null;
  update_count: number;
  ranking?: number | null;
}

const typeLabels: Record<string, string> = {
  app: 'App',
  website: '网站',
  both: 'App+网站',
};

export default function CompetitorCard({
  id,
  name,
  language,
  type,
  url,
  description,
  latest_update_title,
  latest_update_date,
  update_count,
  ranking,
}: CompetitorCardProps) {
  const langLabel = LANGUAGE_MAP[language] || language;

  return (
    <Link href={`/competitors/${id}`} className="block h-full">
      <article className="bg-card p-5 md:p-6 hover:bg-card-hover h-full flex flex-col group">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="eyebrow mb-2">{ranking ? `Market Rank 0${ranking}` : 'Watchlist'}</p>
            <h3 className="font-semibold text-foreground truncate text-2xl group-hover:text-primary">{name}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] px-2 py-1 border border-primary/30 bg-primary-light text-primary-dark font-bold">
                {langLabel}
              </span>
              <span className="text-[10px] px-2 py-1 border border-border bg-muted text-text-secondary">
                {typeLabels[type] || type}
              </span>
            </div>
          </div>
          {update_count > 0 && (
            <div className="flex-shrink-0 ml-2">
              <span className="inline-flex items-center justify-center min-w-12 h-8 border border-border text-primary text-xs font-bold">
                {update_count} 条
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary leading-relaxed mb-3 flex-1">
          {description}
        </p>

        {/* Latest Update */}
        {latest_update_title && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
              <span className="text-primary">●</span>
              <span>最新动态</span>
              {latest_update_date && (
                <span className="ml-auto">{formatDate(latest_update_date)}</span>
              )}
            </div>
            <p className="text-sm text-foreground line-clamp-2">{latest_update_title}</p>
          </div>
        )}

        {/* URL */}
        {url && (
          <div className="mt-2 text-xs text-text-secondary truncate">
            {url.replace('https://', '').replace('http://', '')}
          </div>
        )}
      </article>
    </Link>
  );
}
