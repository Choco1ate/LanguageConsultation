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
  latest_update_summary?: string | null;
  latest_update_impact?: string | null;
  latest_update_category?: string | null;
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
  latest_update_summary,
  latest_update_impact,
  latest_update_category,
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
              <span>{latest_update_category || '最新动态'}</span>
              {latest_update_date && (
                <span className="ml-auto">{formatDate(latest_update_date)}</span>
              )}
            </div>
            <p className="text-sm text-foreground line-clamp-2">{latest_update_summary || latest_update_title}</p>
            {latest_update_impact && <p className="text-xs text-text-secondary border-l-2 border-primary pl-2 mt-2 line-clamp-2">{latest_update_impact}</p>}
            {latest_update_summary && <p className="text-[9px] text-text-tertiary mt-2">AI 辅助整理 · 来源可追溯</p>}
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
