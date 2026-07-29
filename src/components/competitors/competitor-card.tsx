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
    <Link href={`/competitors/${id}`}>
      <div className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate text-base">{name}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary-dark font-medium">
                {langLabel}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-text-secondary">
                {typeLabels[type] || type}
              </span>
            </div>
          </div>
          {update_count > 0 && (
            <div className="flex-shrink-0 ml-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {update_count}
              </span>
            </div>
          )}
          {ranking && (
            <span className="flex-shrink-0 ml-2 text-xs font-bold text-primary bg-primary-light px-2 py-1 rounded-full">
              TOP {ranking}
            </span>
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
              <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
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
      </div>
    </Link>
  );
}
