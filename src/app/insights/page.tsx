import Link from 'next/link';
import { getInsights, normalizeRange } from '@/lib/analytics';
import { formatDateTime, LANGUAGE_MAP } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Finding = {
  id: string;
  title: string;
  insight: string;
  impact: string;
  subject: string;
  confidence: 'high' | 'medium' | 'low';
  evidenceIds: string[];
  evidenceCount: number;
  change: {
    current: number;
    previous: number;
    delta: number | null;
    direction: 'up' | 'down' | 'flat' | 'insufficient';
    label: string;
  };
};

type Evidence = {
  id: string;
  entityType: 'article' | 'competitor_update';
  title: string;
  sourceName: string;
  sourceUrl: string;
  internalUrl: string;
  category: string;
  publishedAt: string;
};

function changeTone(direction: Finding['change']['direction']) {
  if (direction === 'up') return 'text-primary-dark bg-primary-light';
  if (direction === 'down') return 'text-accent bg-accent-light';
  return 'text-text-secondary bg-muted';
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; language?: string }>;
}) {
  const query = await searchParams;
  const range = normalizeRange(query.range || null);
  const language = query.language && Object.hasOwn(LANGUAGE_MAP, query.language) && query.language !== 'chinese'
    ? query.language
    : 'all';
  const data = getInsights(range, language);
  const findings = data.findings as Finding[];
  const evidence = data.evidence as Evidence[];
  const signals = data.signals;
  const coverage = data.coverage;

  const buildHref = (next: { range?: string; language?: string }) => {
    const params = new URLSearchParams({ range, language, ...next });
    return `/insights?${params.toString()}`;
  };

  return (
    <div className="editorial-page">
      <header className="page-rule py-9">
        <div className="grid lg:grid-cols-[1fr_auto] gap-7 items-end">
          <div className="max-w-4xl">
            <p className="eyebrow">Industry Trends / 来源驱动的市场观察</p>
            <h1 className="text-4xl md:text-6xl mt-3">行业趋势</h1>
            <p className="text-base md:text-lg text-text-secondary leading-8 mt-5 max-w-3xl">
              追踪平台、产品、价格与课程变化，帮助你判断过去一段时间行业发生了什么、为什么重要，以及接下来应该关注什么。
            </p>
          </div>
          <Link href="/reports" className="border border-foreground px-5 py-3 text-sm font-bold hover:bg-muted">
            阅读本周观察 →
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mt-8">
          {(['7d', '30d'] as const).map((item) => (
            <Link key={item} href={buildHref({ range: item })} className={`px-4 py-2 text-sm border ${range === item ? 'bg-foreground text-background border-foreground' : 'bg-card border-border'}`}>
              近 {item === '7d' ? 7 : 30} 日
            </Link>
          ))}
          <span className="w-px bg-border mx-1" />
          <Link href={buildHref({ language: 'all' })} className={`px-3 py-2 text-sm border ${language === 'all' ? 'bg-primary text-white border-primary' : 'bg-card border-border'}`}>全部语种</Link>
          {Object.entries(LANGUAGE_MAP).filter(([key]) => !['multi', 'chinese'].includes(key)).map(([key, label]) => (
            <Link key={key} href={buildHref({ language: key })} className={`px-3 py-2 text-sm border ${language === key ? 'bg-primary text-white border-primary' : 'bg-card border-border'}`}>{label}</Link>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 border-b border-border">
        {[
          ['最近更新', coverage.latestUpdate ? formatDateTime(coverage.latestUpdate) : '等待首轮采集'],
          ['监测平台', `${coverage.monitoredPlatforms} 个`],
          ['有效来源', `${coverage.effectiveSources} 个`],
          ['数据新鲜度', coverage.freshness === 'fresh' ? `${coverage.freshnessHours} 小时内` : coverage.freshness === 'aging' ? '需要更新' : '数据已过期'],
        ].map(([label, value], index) => (
          <div key={label} className={`py-6 ${index % 2 ? 'pl-5' : 'pr-5'} lg:px-6 lg:first:pl-0 border-border ${index < 3 ? 'lg:border-r' : ''}`}>
            <p className="text-[11px] text-text-secondary">{label}</p>
            <strong className="block text-lg md:text-xl mt-2">{value}</strong>
          </div>
        ))}
      </section>

      <section className="py-9 border-b border-border">
        <div className="bg-foreground text-background p-7 md:p-9 grid lg:grid-cols-[.35fr_1fr] gap-6 relative overflow-hidden">
          <span className="absolute right-[-1rem] top-[-5rem] text-[14rem] font-serif opacity-[.05]">势</span>
          <div>
            <p className="eyebrow text-primary">本期核心判断</p>
            <p className="text-xs opacity-60 mt-3">
              {data.summary.generationMethod === 'ai' ? 'AI 辅助整理 · 来源已校验' : '规则分析 · 来源可追溯'}
            </p>
          </div>
          <div>
            <h2 className="editorial-title text-2xl md:text-4xl leading-tight">{data.summary.headline}</h2>
            <p className="opacity-70 leading-7 mt-4 max-w-3xl">{data.summary.text}</p>
            {!data.summary.sufficientEvidence && (
              <p className="mt-5 border-l-2 border-primary pl-4 text-sm">当前样本不足，以下内容作为观察信号，不构成稳定趋势判断。</p>
            )}
          </div>
        </div>
      </section>

      <section className="py-10 border-b border-border">
        <div className="panel-heading">
          <div><p className="section-kicker">Key Findings</p><h2 className="text-3xl mt-2">本期关键变化</h2></div>
          <p className="text-xs text-text-secondary">当前周期对比前一等长周期</p>
        </div>
        {findings.length ? (
          <div className="grid lg:grid-cols-2 gap-px bg-border border border-border">
            {findings.map((finding, index) => (
              <a key={finding.id} href={finding.evidenceIds[0] ? `#evidence-${finding.evidenceIds[0]}` : '#evidence'} className="bg-card p-6 md:p-7 group">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-text-tertiary">0{index + 1} · {finding.subject}</span>
                  <span className={`text-[11px] px-2.5 py-1 ${changeTone(finding.change.direction)}`}>{finding.change.label}</span>
                </div>
                <h3 className="text-xl md:text-2xl mt-5 group-hover:text-primary">{finding.title}</h3>
                <p className="text-sm leading-6 mt-3">{finding.insight}</p>
                <p className="text-sm text-text-secondary leading-6 mt-4 border-l-2 border-primary pl-3">{finding.impact}</p>
                <div className="flex justify-between mt-6 text-[11px] text-text-tertiary">
                  <span>{finding.evidenceCount} 条证据</span>
                  <span>置信度：{finding.confidence === 'high' ? '高' : finding.confidence === 'medium' ? '中' : '低'} →</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="panel text-text-secondary">尚无足够的可验证信号。系统会继续采集官方来源，并在形成有效变化后更新。</div>
        )}
      </section>

      <section className="py-10 grid lg:grid-cols-[1.1fr_.9fr] gap-8 border-b border-border">
        <div>
          <div className="panel-heading"><div><p className="section-kicker">Platform Movement</p><h2 className="text-2xl mt-2">谁在行动</h2></div></div>
          <div className="divide-y divide-border border-y border-border">
            {signals.platforms.map((platform, index) => (
              <Link key={platform.id} href={`/competitors/${platform.id}`} className="grid grid-cols-[2rem_1fr_auto] gap-3 py-4 items-center group">
                <span className="text-xs text-text-tertiary">{String(index + 1).padStart(2, '0')}</span>
                <span><strong className="group-hover:text-primary">{platform.name}</strong><small className="block text-text-secondary mt-1">{platform.categoryCount ? `${platform.categoryCount} 类有效信号` : '本期暂无有效动作'}</small></span>
                <span className={`text-xs px-2 py-1 ${changeTone(platform.change.direction)}`}>{platform.change.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="panel-heading"><div><p className="section-kicker">Market Signals</p><h2 className="text-2xl mt-2">市场在变什么</h2></div></div>
          {signals.categories.length ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {signals.categories.map((signal) => (
                <div key={signal.key} className="metric-card">
                  <p className="text-sm text-text-secondary">{signal.label}</p>
                  <strong className="text-3xl block mt-3">{signal.change.current}</strong>
                  <span className={`inline-block text-[11px] px-2 py-1 mt-3 ${changeTone(signal.change.direction)}`}>{signal.change.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel text-text-secondary">本期暂无价格、功能、课程或合作类有效变化；常规版本维护已自动折叠。</div>
          )}
        </div>
      </section>

      <section className="py-10 grid lg:grid-cols-2 gap-8 border-b border-border">
        <div>
          <div className="panel-heading"><div><p className="section-kicker">Demand Signals</p><h2 className="text-2xl mt-2">语种关注变化</h2></div></div>
          <div className="space-y-3">
            {signals.languages.map((signal) => (
              <div key={signal.key} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center border-b border-border pb-3">
                <strong>{signal.label}</strong>
                <span className="text-sm text-text-secondary">{signal.change.current} 篇</span>
                <span className={`text-[11px] px-2 py-1 ${changeTone(signal.change.direction)}`}>{signal.change.label}</span>
              </div>
            ))}
            {!signals.languages.length && <p className="text-sm text-text-secondary">本期暂无可比较的语种内容样本。</p>}
          </div>
        </div>
        <div>
          <div className="panel-heading"><div><p className="section-kicker">Topic Watch</p><h2 className="text-2xl mt-2">近期关注主题</h2></div></div>
          <div className="flex flex-wrap gap-2">
            {signals.keywords.map((item) => (
              <Link key={item.keyword} href={`/articles?tag=${encodeURIComponent(item.keyword)}`} className="border border-border bg-card px-3 py-2 text-sm hover:border-primary">
                {item.keyword} <b>{item.count}</b> <span className="text-text-tertiary">· {item.sourceCount} 来源</span>
              </Link>
            ))}
            {!signals.keywords.length && <p className="text-sm text-text-secondary">主题样本仍在积累。</p>}
          </div>
        </div>
      </section>

      <section id="evidence" className="py-10 border-b border-border">
        <div className="panel-heading">
          <div><p className="section-kicker">Evidence Timeline</p><h2 className="text-3xl mt-2">证据时间线</h2></div>
          <span className="text-xs text-text-secondary">{evidence.length} 条公开证据</span>
        </div>
        {evidence.length ? (
          <div className="divide-y divide-border">
            {evidence.map((item) => (
              <article key={item.id} id={`evidence-${item.id}`} className="grid md:grid-cols-[7rem_1fr_auto] gap-4 py-5 scroll-mt-24">
                <div><span className="text-xs text-primary font-bold">{item.category}</span><time className="block text-[11px] text-text-tertiary mt-2">{item.publishedAt ? item.publishedAt.slice(0, 10) : '日期待确认'}</time></div>
                <div><Link href={item.internalUrl} className="font-semibold hover:text-primary">{item.title}</Link><p className="text-xs text-text-secondary mt-2">{item.sourceName}</p></div>
                {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold self-center">查看原始来源 ↗</a>}
              </article>
            ))}
          </div>
        ) : <div className="panel text-text-secondary">暂无可展示证据，完成下一轮官方来源采集后自动更新。</div>}
      </section>

      <section className="py-10">
        <div className="panel-heading"><div><p className="section-kicker">Data Coverage</p><h2 className="text-2xl mt-2">数据覆盖说明</h2></div></div>
        <div className="grid md:grid-cols-[.7fr_1.3fr] gap-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="metric-card"><p className="text-xs text-text-secondary">来源成功率</p><strong className="text-3xl block mt-2">{coverage.successRate}%</strong></div>
            <div className="metric-card"><p className="text-xs text-text-secondary">抓取失败</p><strong className="text-3xl block mt-2">{coverage.failedSources}</strong></div>
          </div>
          <div className="panel">
            <p className="font-bold">统计口径</p>
            <p className="text-sm text-text-secondary leading-7 mt-3">
              当前周期与前一等长周期比较；仅统计公开官方来源和站内有效文章。常规版本维护不进入核心趋势，内容数量不直接代表市场规模。
            </p>
            {coverage.gaps.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm">
                {coverage.gaps.map((gap) => <li key={gap} className="border-l-2 border-primary pl-3">{gap}</li>)}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
