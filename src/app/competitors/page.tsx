'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CompetitorCard from '@/components/competitors/competitor-card';
import CompetitorFilters from '@/components/competitors/competitor-filters';

interface Competitor {
  id: string;
  name: string;
  language: string;
  type: string;
  url: string;
  logo_url: string | null;
  description: string;
  latest_update_title: string | null;
  latest_update_date: string | null;
  update_count: number;
  ranking: number | null;
}

function CompetitorsContent() {
  const searchParams = useSearchParams();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(() => searchParams.get('language') || 'all');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    const params = new URLSearchParams();
    if (selectedLanguage !== 'all') {
      params.set('language', selectedLanguage);
    }

    fetch(`/api/competitors?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setCompetitors(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch competitors:', err);
        setError('产品动态暂时无法加载，请稍后重试。');
        setLoading(false);
      });
  }, [selectedLanguage]);

  return (
    <div className="editorial-page">
      {/* Page Header */}
      <div className="page-rule py-8 mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
        <div>
          <p className="eyebrow mb-3">China Market Intelligence / Top 10</p>
          <h1 className="text-4xl md:text-6xl mb-3">行业产品动态</h1>
          <p className="text-text-secondary">
            聚焦国内 10 家代表性平台，持续观察课程、产品、价格、品牌与公司动态
          </p>
        </div>
        <Link href="/compare" className="px-5 py-3 bg-foreground text-background text-sm font-bold text-center hover:bg-primary">进入竞品对比 →</Link>
      </div>

      {/* Filters */}
      <div className="panel mb-6">
        <CompetitorFilters
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-6 text-sm text-text-secondary">
        <span>国内 Top 10 · 当前展示 {competitors.length} 个平台</span>
        {selectedLanguage !== 'all' && (
          <button
            onClick={() => setSelectedLanguage('all')}
            className="text-primary hover:underline"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* Grid */}
      {error ? (
        <div className="border border-primary bg-primary-light p-7">
          <p className="font-bold text-primary-dark">数据连接中断</p><p className="text-sm text-text-secondary mt-1">{error}</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border p-5 animate-pulse">
              <div className="h-5 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-1/2 mb-4" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
            {competitors.map((c) => (
            <div key={c.id} className="bg-background"><CompetitorCard {...c} /></div>
          ))}
        </div>
      )}

      {!loading && !error && competitors.length === 0 && (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-lg mb-2">暂无竞品数据</p>
          <p className="text-sm">请先运行数据初始化脚本</p>
        </div>
      )}
    </div>
  );
}

export default function CompetitorsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-text-secondary">正在加载竞品…</div>}>
      <CompetitorsContent />
    </Suspense>
  );
}
