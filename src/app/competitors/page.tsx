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

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedLanguage !== 'all') {
      params.set('language', selectedLanguage);
    }

    fetch(`/api/competitors?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setCompetitors(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch competitors:', err);
        setLoading(false);
      });
  }, [selectedLanguage]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="section-kicker mb-2">China Top 10</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">国内小语种行业产品动态</h1>
          <p className="text-text-secondary">
            聚焦国内 10 家代表性平台，持续观察课程、产品、价格、品牌与公司动态
          </p>
        </div>
        <Link href="/compare" className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium text-center">进入竞品对比</Link>
      </div>

      {/* Filters */}
      <div className="mb-6">
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
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
              <div className="h-5 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-1/2 mb-4" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {competitors.map((c) => (
            <CompetitorCard key={c.id} {...c} />
          ))}
        </div>
      )}

      {!loading && competitors.length === 0 && (
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
