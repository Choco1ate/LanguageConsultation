'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ArticleCard from '@/components/articles/article-card';
import TagFilter from '@/components/articles/tag-filter';

interface Article {
  id: string;
  title: string;
  summary: string | null;
  source_url: string;
  source_name: string | null;
  language: string | null;
  tags: string | null;
  published_at: string | null;
  score: number | null;
}

function ArticlesContent() {
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState(() => searchParams.get('tag') || '');
  const [selectedLanguage, setSelectedLanguage] = useState(() => searchParams.get('language') || 'all');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') === 'date' ? 'date' : 'score');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const fetchArticles = useCallback(() => {
    setError('');
    const params = new URLSearchParams();
    if (selectedTag) params.set('tag', selectedTag);
    if (selectedLanguage !== 'all') params.set('language', selectedLanguage);
    params.set('sort', sortBy);
    params.set('page', page.toString());

    fetch(`/api/articles?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setArticles(Array.isArray(data.articles) ? data.articles : []);
        setTotal(Number(data.total) || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch articles:', err);
        setError('文章数据暂时无法加载，请检查网络后重试。');
        setLoading(false);
      });
  }, [selectedTag, selectedLanguage, sortBy, page]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleTagChange = (tag: string) => {
    setLoading(true);
    setSelectedTag(tag);
    setPage(1);
  };

  const handleLanguageChange = (language: string) => {
    setLoading(true);
    setSelectedLanguage(language);
    setPage(1);
  };

  const handleSortChange = (sort: string) => {
    setLoading(true);
    setSortBy(sort);
    setPage(1);
  };

  return (
    <div className="editorial-page">
      <div className="page-rule py-8 mb-7 grid md:grid-cols-[1fr_auto] gap-5 items-end">
        <div>
          <p className="eyebrow mb-3">Editorial Archive / 每日选读</p>
          <h1 className="text-4xl md:text-6xl">精品文章</h1>
          <p className="text-text-secondary mt-4 max-w-2xl leading-7">
            汇集考试、留学与语言学习领域的高价值内容，按来源与热度持续整理。
          </p>
        </div>
        <div className="text-right"><strong className="text-4xl">{total}</strong><span className="block text-xs text-text-secondary mt-1">篇已收录文章</span></div>
      </div>

      <div className="panel mb-7">
        <TagFilter
          selectedTag={selectedTag}
          selectedLanguage={selectedLanguage}
          sortBy={sortBy}
          onTagChange={handleTagChange}
          onLanguageChange={handleLanguageChange}
          onSortChange={handleSortChange}
        />
      </div>

      <div className="flex items-center justify-between mb-6 text-sm text-text-secondary">
        <span>共 {total} 篇文章</span>
        {(selectedTag || selectedLanguage !== 'all' || sortBy === 'score') && (
          <button
            onClick={() => {
              setSelectedTag('');
              setSelectedLanguage('all');
              setSortBy('score');
              setLoading(true);
              setPage(1);
            }}
            className="text-primary hover:underline"
          >
            重置筛选
          </button>
        )}
      </div>

      {error ? (
        <div className="border border-primary bg-primary-light p-7 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div><p className="font-bold text-primary-dark">数据连接中断</p><p className="text-sm text-text-secondary mt-1">{error}</p></div>
          <button onClick={fetchArticles} className="bg-foreground text-background px-4 py-2 text-sm font-bold">重新加载</button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border p-5 animate-pulse">
              <div className="flex gap-2 mb-3">
                <div className="h-5 bg-muted rounded-full w-12" />
                <div className="h-5 bg-muted rounded-full w-16" />
              </div>
              <div className="h-5 bg-muted rounded w-full mb-2" />
              <div className="h-5 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
            {articles.map((article) => (
              <div key={article.id} className="bg-background"><ArticleCard {...article} /></div>
            ))}
          </div>

          {total > 20 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => { setLoading(true); setPage((p) => Math.max(1, p - 1)); }}
                disabled={page === 1}
                className="px-4 py-2 border border-border text-sm disabled:opacity-40 hover:bg-muted"
              >
                上一页
              </button>
              <span className="text-sm text-text-secondary px-3">
                第 {page} 页
              </span>
              <button
                onClick={() => { setLoading(true); setPage((p) => p + 1); }}
                disabled={articles.length < 20}
                className="px-4 py-2 border border-border text-sm disabled:opacity-40 hover:bg-muted"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {!loading && !error && articles.length === 0 && (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-lg mb-2">该分类下暂无内容</p>
          <p className="text-sm">试试切换其他筛选条件</p>
        </div>
      )}
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-text-secondary">正在加载文章…</div>}>
      <ArticlesContent />
    </Suspense>
  );
}
