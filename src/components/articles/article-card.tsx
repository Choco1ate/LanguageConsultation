import Link from 'next/link';
import { formatDate, LANGUAGE_MAP, truncate } from '@/lib/utils';

interface ArticleCardProps {
  id: string;
  title: string;
  summary: string | null;
  source_name: string | null;
  language: string | null;
  tags: string | null;
  published_at: string | null;
  score?: number | null;
}

export default function ArticleCard({
  id,
  title,
  summary,
  source_name,
  language,
  tags,
  published_at,
  score,
}: ArticleCardProps) {
  const langLabel = language ? (LANGUAGE_MAP[language] || language) : '';
  const parsedTags: string[] = tags ? JSON.parse(tags) : [];

  return (
    <Link href={`/articles/${id}`} className="block h-full">
      <article className="bg-card p-5 md:p-6 hover:bg-card-hover h-full flex flex-col group">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {langLabel && (
            <span className="text-[10px] px-2 py-1 border border-primary/30 bg-primary-light text-primary-dark font-bold tracking-wide">
              {langLabel}
            </span>
          )}
          {parsedTags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-1 border border-border bg-muted text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground text-xl leading-snug mb-3 line-clamp-2 group-hover:text-primary">
          {title}
        </h3>

        {/* Summary */}
        {summary && (
          <p className="text-sm text-text-secondary leading-relaxed mb-3 flex-1 line-clamp-3">
            {truncate(summary, 120)}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-[11px] text-text-secondary pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            {source_name && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                {source_name}
              </span>
            )}
            {score != null && score > 0 && (
              <span className="flex items-center gap-0.5 text-orange-500">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.495-2.423A11.5 11.5 0 006.5 14c.12.118.245.23.375.335a3.5 3.5 0 01-.795-.165c-.46-.155-.86-.41-1.165-.74a3.5 3.5 0 01-.615-1.155 2.5 2.5 0 01.7-2.68c.37-.345.83-.57 1.315-.685a5.5 5.5 0 011.285-.14c.425 0 .85.05 1.26.155a2.1 2.1 0 001.545-.145c.42-.24.725-.615.91-1.055a2.8 2.8 0 00.155-1.555c-.075-.44-.24-.845-.5-1.2a2.1 2.1 0 00-.88-.68" />
                  <path d="M10 2l2.166 4.392 4.844.703-3.505 3.417.827 4.827L10 13.07l-4.332 2.27.827-4.827L3 7.095l4.844-.703L10 2z" />
                </svg>
                {score}
              </span>
            )}
          </div>
          {published_at && (
            <time>{formatDate(published_at)}</time>
          )}
        </div>
      </article>
    </Link>
  );
}
