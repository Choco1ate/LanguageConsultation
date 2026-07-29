import Link from 'next/link';
import { getInsights, normalizeRange } from '@/lib/analytics';
import { LANGUAGE_MAP } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; language?: string }>;
}) {
  const query = await searchParams;
  const range = normalizeRange(query.range || null);
  const language = query.language || 'all';
  const data = getInsights(range, language);
  const maxDaily = Math.max(1, ...data.articleSeries.map((item) => item.count));
  const maxLanguage = Math.max(1, ...data.languageHeat.map((item) => item.count));

  const buildHref = (next: { range?: string; language?: string }) => {
    const params = new URLSearchParams({ range, language, ...next });
    return `/insights?${params.toString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
        <div className="max-w-3xl">
          <p className="section-kicker">Rule-based Insights</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">趋势看板</h1>
          <p className="text-text-secondary mt-3">{data.methodology}</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d'] as const).map((item) => (
            <Link key={item} href={buildHref({ range: item })} className={`px-4 py-2 rounded-full text-sm ${range === item ? 'bg-primary text-white' : 'bg-white border border-border'}`}>
              近 {item === '7d' ? 7 : 30} 日
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <Link href={buildHref({ language: 'all' })} className={`px-3 py-1.5 rounded-full text-sm ${language === 'all' ? 'bg-foreground text-white' : 'bg-white border border-border'}`}>全部语种</Link>
        {Object.entries(LANGUAGE_MAP).filter(([key]) => key !== 'multi').map(([key, label]) => (
          <Link key={key} href={buildHref({ language: key })} className={`px-3 py-1.5 rounded-full text-sm ${language === key ? 'bg-foreground text-white' : 'bg-white border border-border'}`}>{label}</Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="metric-card"><p className="text-sm text-text-secondary">文章样本</p><p className="text-3xl font-bold mt-2">{data.totals.articles}</p></div>
        <div className="metric-card"><p className="text-sm text-text-secondary">竞品更新</p><p className="text-3xl font-bold mt-2">{data.totals.competitorUpdates}</p></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="panel">
          <div className="panel-heading"><h2 className="text-xl font-bold">高增长情报主题</h2></div>
          <div className="space-y-3">
            {data.editorialCategories.length ? data.editorialCategories.map((item, index) => (
              <div key={item.category} className="flex items-center gap-4 border-b border-border pb-3">
                <span className="text-primary font-bold">0{index + 1}</span>
                <span className="flex-1 font-medium">{item.category}</span>
                <b>{item.count}</b>
              </div>
            )) : <p className="text-sm text-text-secondary">完成首轮内容增强后，将展示真实情报主题。</p>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading"><h2 className="text-xl font-bold">平台信号活跃度</h2></div>
          <div className="space-y-3">
            {(data.platformSignals as Array<{ id: string; name: string; update_count: number; category_count: number; latest_update: string }>).map((item) => (
              <Link key={item.id} href={`/competitors/${item.id}`} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center border-b border-border pb-3 text-sm">
                <strong>{item.name}</strong>
                <span className="text-text-secondary">{item.category_count} 类信号</span>
                <b>{item.update_count} 条</b>
              </Link>
            ))}
          </div>
        </section>

        <section className="panel lg:col-span-2">
          <div className="panel-heading"><h2 className="text-xl font-bold">来源覆盖与新鲜度</h2></div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="metric-card"><p className="text-xs text-text-secondary">活跃来源</p><b className="text-3xl block mt-2">{Number(data.sourceFreshness.source_count || 0)}</b></div>
            <div className="metric-card"><p className="text-xs text-text-secondary">成功抓取</p><b className="text-3xl block mt-2">{Number(data.sourceFreshness.successful_runs || 0)}</b></div>
            <div className="metric-card"><p className="text-xs text-text-secondary">最近更新</p><b className="text-sm block mt-3">{data.sourceFreshness.latest_run ? String(data.sourceFreshness.latest_run).slice(0, 16) : '暂无'}</b></div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading"><h2 className="text-xl font-bold">文章数量走势</h2></div>
          <div className="h-56 flex items-end gap-1">
            {data.articleSeries.map((item, index) => (
              <div key={item.date} className="flex-1 h-full flex flex-col justify-end items-center group min-w-0">
                <span className="text-[10px] text-text-secondary opacity-0 group-hover:opacity-100">{item.count}</span>
                <div className="w-full max-w-5 bg-primary/75 rounded-t-sm min-h-[2px]" style={{ height: `${Math.max(2, (item.count / maxDaily) * 88)}%` }} />
                {(data.articleSeries.length <= 7 || index % 5 === 0) && <span className="text-[9px] text-text-secondary mt-2">{item.date.slice(5)}</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading"><h2 className="text-xl font-bold">语种热度</h2></div>
          <div className="space-y-4">
            {data.languageHeat.map((item) => (
              <div key={item.key}>
                <div className="flex justify-between text-sm mb-1"><span>{item.label}</span><span className="text-text-secondary">{item.count}</span></div>
                <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${(item.count / maxLanguage) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading"><h2 className="text-xl font-bold">竞品更新分类</h2></div>
          <div className="grid grid-cols-2 gap-3">
            {data.updateCategories.map((item) => (
              <div key={item.key} className="rounded-xl bg-muted p-4"><p className="text-sm text-text-secondary">{item.label}</p><p className="text-2xl font-bold mt-1">{item.count}</p></div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading"><h2 className="text-xl font-bold">热门关键词</h2></div>
          <div className="flex flex-wrap gap-2">
            {data.keywords.map((item) => (
              <span key={item.keyword} className="px-3 py-2 rounded-full bg-primary-light text-primary-dark text-sm">
                {item.keyword} <b>{item.count}</b> · {item.sourceCount} 来源
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
