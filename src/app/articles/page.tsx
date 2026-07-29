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

  const fetchArticles = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedTag) params.set('tag', selectedTag);
    if (selectedLanguage !== 'all') params.set('language', selectedLanguage);
    params.set('sort', sortBy);
    params.set('page', page.toString());

    fetch(`/api/articles?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.articles);
        setTotal(data.total);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch articles:', err);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">精品文章</h1>
        <p className="text-text-secondary">
          每日精选小语种考级、高考、留学等资讯，助你掌握最新动态
        </p>
      </div>

      <div className="mb-6">
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article) => (
              <ArticleCard key={article.id} {...article} />
            ))}
          </div>

          {total > 20 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => { setLoading(true); setPage((p) => Math.max(1, p - 1)); }}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
              >
                上一页
              </button>
              <span className="text-sm text-text-secondary px-3">
                第 {page} 页
              </span>
              <button
                onClick={() => { setLoading(true); setPage((p) => p + 1); }}
                disabled={articles.length < 20}
                className="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {!loading && articles.length === 0 && (
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
