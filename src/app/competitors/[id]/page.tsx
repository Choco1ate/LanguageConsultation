'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import UpdateTimeline from '@/components/competitors/update-timeline';
import ProductMatrix, { type CompetitorProduct } from '@/components/competitors/product-matrix';
import { LANGUAGE_MAP } from '@/lib/utils';

interface Competitor {
  id: string;
  name: string;
  language: string;
  type: string;
  url: string;
  description: string;
}

interface Update {
  id: string;
  product_name: string | null;
  title: string;
  content: string | null;
  update_type: string | null;
  source_url: string | null;
  published_at: string | null;
  source_channel?: string | null;
  editorial?: {
    summary: string;
    whyItMatters: string;
    keyPoints: string[];
    category: string;
    generatedAt: string;
    aiAssisted: true;
  } | null;
}

export default function CompetitorDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [products, setProducts] = useState<CompetitorProduct[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/competitors/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCompetitor(data.competitor);
        setProducts(data.products || []);
        setUpdates(data.updates);
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
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted rounded w-2/3 mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!competitor) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-text-secondary text-lg">未找到该竞品信息</p>
        <Link href="/competitors" className="text-primary hover:underline mt-2 inline-block">
          ← 返回竞品列表
        </Link>
      </div>
    );
  }

  const langLabel = LANGUAGE_MAP[competitor.language] || competitor.language;
  const typeLabel = { app: 'App', website: '网站', both: 'App+网站' }[competitor.type] || competitor.type;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-text-secondary">
        <Link href="/competitors" className="hover:text-primary">行业产品动态</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{competitor.name}</span>
      </nav>

      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{competitor.name}</h1>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm px-3 py-0.5 rounded-full bg-primary-light text-primary-dark font-medium">
                {langLabel}
              </span>
              <span className="text-sm px-3 py-0.5 rounded-full bg-muted text-text-secondary">
                {typeLabel}
              </span>
            </div>
            <p className="text-text-secondary">{competitor.description}</p>
          </div>
          {competitor.url && (
            <a
              href={competitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 ml-4 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover shadow-sm transition-colors"
            >
              访问官网 →
            </a>
          )}
        </div>
      </div>

      {/* Product matrix */}
      <section className="mb-10">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Product Portfolio</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">旗下核心产品</h2>
          </div>
          <p className="text-sm text-text-secondary">共 {products.length} 个已核验产品</p>
        </div>
        <ProductMatrix products={products} competitorId={competitor.id} />
      </section>

      {/* Updates Timeline */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          更新记录 ({updates.length})
        </h2>
        <UpdateTimeline updates={updates} />
      </div>
    </div>
  );
}
