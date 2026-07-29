'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDate, LANGUAGE_MAP } from '@/lib/utils';
import ArticleCard from '@/components/articles/article-card';

interface Article {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  source_url: string;
  source_name: string | null;
  language: string | null;
  tags: string | null;
  published_at: string | null;
  editorial?: {
    summary: string;
    whyItMatters: string;
    audience: string;
    keyPoints: string[];
    category: string;
    confidence: number;
    sourceUrls: string[];
    generatedAt: string;
    model: string;
    aiAssisted: true;
  } | null;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/articles/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setArticle(data.article);
        setRelated(data.related);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch:', err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-6" />
          <div className="h-8 bg-muted rounded w-3/4 mb-4" />
          <div className="h-4 bg-muted rounded w-1/3 mb-8" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-text-secondary text-lg">未找到该文章</p>
        <Link href="/articles" className="text-primary hover:underline mt-2 inline-block">
          ← 返回文章列表
        </Link>
      </div>
    );
  }

  const langLabel = article.language ? (LANGUAGE_MAP[article.language] || article.language) : '';
  const parsedTags: string[] = article.tags ? JSON.parse(article.tags) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-text-secondary">
        <Link href="/articles" className="hover:text-primary">精品文章</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground line-clamp-1 inline-block max-w-[200px] align-bottom">{article.title}</span>
      </nav>

      {/* Article Header */}
      <article className="bg-card rounded-xl border border-border p-6 md:p-8 mb-8">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {article.editorial && (
            <span className="text-xs px-2.5 py-1 bg-accent-light border border-accent font-bold">
              {article.editorial.category}
            </span>
          )}
          {langLabel && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary-light text-primary-dark font-medium">
              {langLabel}
            </span>
          )}
          {parsedTags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-full bg-muted text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-4">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-text-secondary pb-4 mb-6 border-b border-border">
          {article.source_name && (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              {article.source_name}
            </span>
          )}
          {article.published_at && (
            <time className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(article.published_at)}
            </time>
          )}
          {article.source_url && (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline ml-auto flex items-center gap-1"
            >
              查看原文
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        {/* Summary */}
        {(article.editorial?.summary || article.summary) && (
          <div className="bg-primary-light/30 rounded-lg p-4 mb-6 border-l-4 border-primary/60">
            <p className="text-xs font-bold text-primary mb-2">编辑摘要</p>
            <p className="text-foreground leading-relaxed">{article.editorial?.summary || article.summary}</p>
          </div>
        )}

        {article.editorial && (
          <div className="grid md:grid-cols-[1fr_.72fr] gap-6 mb-7">
            <section>
              <p className="eyebrow mb-3">Key Signals</p>
              <h2 className="text-xl mb-3">关键信息</h2>
              <ol className="space-y-3">
                {article.editorial.keyPoints.map((point, index) => (
                  <li key={point} className="flex gap-3 text-sm leading-6">
                    <span className="text-primary font-bold">0{index + 1}</span><span>{point}</span>
                  </li>
                ))}
              </ol>
            </section>
            <aside className="bg-muted p-5">
              <p className="text-xs font-bold text-primary">为什么值得关注</p>
              <p className="text-sm leading-6 mt-2">{article.editorial.whyItMatters}</p>
              <p className="text-xs text-text-secondary mt-4">适合：{article.editorial.audience}</p>
            </aside>
          </div>
        )}

        {/* Content */}
        {article.content && (
          <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
            <p>{article.content}</p>
          </div>
        )}
        {article.editorial && (
          <div className="mt-7 pt-4 border-t border-border text-[11px] text-text-tertiary">
            AI 辅助整理 · 结论仅基于所列来源 · 生成于 {formatDate(article.editorial.generatedAt)}
          </div>
        )}
      </article>

      {/* Related Articles */}
      {related.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">相关推荐</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {related.map((r) => (
              <ArticleCard key={r.id} {...r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
