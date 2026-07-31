import Link from 'next/link';
import { getWeeklyReport, listWeeklyReports, type WeeklySection } from '@/lib/editorial';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { TrendEvidence } from '@/lib/trend-analysis';

export const dynamic = 'force-dynamic';

const SECTION_LABELS: Record<WeeklySection['type'], string> = {
  platform_action: '平台动作',
  market_change: '市场变化',
  demand_theme: '需求主题',
  data_note: '数据说明',
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const report = getWeeklyReport(week);
  const sections = report.sections as WeeklySection[];
  const watchPoints = report.watch_points as string[];
  const evidence = report.evidence as TrendEvidence[];
  const metrics = report.metrics as {
    effectiveUpdates?: number;
    activePlatforms?: number;
    articleSamples?: number;
    leadingLanguage?: string;
    sourceSuccessRate?: number;
    coverageGaps?: string[];
    period?: { start?: string; end?: string };
  };
  const persistedReports = listWeeklyReports();
  const archive = persistedReports.some((item) => item.week_start === report.week_start)
    ? persistedReports
    : [{
      week_start: report.week_start,
      title: report.title,
      thesis: report.thesis,
      generation_method: report.generation_method,
      evidence_count: report.evidence_count,
      published_at: report.published_at,
    }, ...persistedReports];
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));

  return (
    <article className="editorial-page max-w-6xl">
      <header className="page-rule py-10">
        <div className="grid lg:grid-cols-[1fr_auto] gap-7 items-start">
          <div>
            <p className="eyebrow">Weekly Intelligence / {String(report.week_start)}</p>
            <h1 className="text-4xl md:text-6xl leading-tight mt-4">{String(report.title)}</h1>
            <p className="editorial-title text-xl md:text-2xl text-text-secondary leading-9 mt-6 max-w-4xl">{String(report.thesis)}</p>
          </div>
          <Link href="/insights" className="border border-foreground px-5 py-3 text-sm font-bold hover:bg-muted">查看行业趋势 →</Link>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-text-tertiary mt-6">
          <span>{report.generation_method === 'ai' ? 'AI 辅助整理' : '规则分析'}</span>
          <span>{Number(report.evidence_count || 0)} 条证据</span>
          <span>{Number(report.source_count || 0)} 个来源</span>
          <span>{Number(report.platform_count || 0)} 个活跃平台</span>
          <span>更新于 {formatDateTime(String(report.published_at))}</span>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-5 border-b border-border">
        {[
          ['有效产品动作', Number(metrics.effectiveUpdates || 0)],
          ['活跃平台', Number(metrics.activePlatforms || 0)],
          ['文章样本', Number(metrics.articleSamples || 0)],
          ['主要语种', metrics.leadingLanguage || '样本不足'],
          ['来源成功率', `${Number(metrics.sourceSuccessRate || 0)}%`],
        ].map(([label, value], index) => (
          <div key={label} className={`py-6 px-4 lg:px-5 lg:first:pl-0 border-border ${index < 4 ? 'lg:border-r' : ''}`}>
            <p className="text-[11px] text-text-secondary">{label}</p>
            <strong className="block text-xl md:text-2xl mt-2">{value}</strong>
          </div>
        ))}
      </section>

      {Number(report.evidence_count || 0) < 3 && (
        <section className="my-8 border-l-4 border-primary bg-primary-light p-5">
          <strong>本周处于样本积累阶段</strong>
          <p className="text-sm text-text-secondary leading-6 mt-2">当前公开来源不足以支持稳定行业判断，以下内容仅整理已验证信号，并明确保留数据缺口。</p>
        </section>
      )}

      <div className="py-10 space-y-12">
        <section>
          <div className="panel-heading">
            <div><p className="section-kicker">Three Key Changes</p><h2 className="text-3xl mt-2">本周关键变化</h2></div>
            {metrics.period?.start && <span className="text-xs text-text-secondary">{formatDate(metrics.period.start)} — {formatDate(metrics.period.end || new Date().toISOString())}</span>}
          </div>
          <div className="space-y-10">
            {sections.map((section, index) => {
              const sectionEvidence = section.evidenceIds.map((id) => evidenceById.get(id)).filter((item): item is TrendEvidence => Boolean(item));
              return (
                <section key={`${section.heading}-${index}`} className="grid md:grid-cols-[4rem_1fr] gap-5">
                  <span className="text-primary text-xl font-bold">0{index + 1}</span>
                  <div>
                    <p className="text-[10px] tracking-wider text-text-tertiary">{SECTION_LABELS[section.type]}</p>
                    <h3 className="text-2xl md:text-3xl mt-2">{section.heading}</h3>
                    <p className="text-text-secondary leading-8 mt-4">{section.analysis}</p>
                    {sectionEvidence.length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-3 mt-5">
                        {sectionEvidence.slice(0, 4).map((item) => (
                          <Link key={item.id} href={`#evidence-${item.id}`} className="border border-border bg-card p-3 text-xs hover:border-primary">
                            <b className="line-clamp-2">{item.title}</b>
                            <span className="block text-text-tertiary mt-2">{item.sourceName} · {item.publishedAt.slice(0, 10)}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section className="grid lg:grid-cols-[1fr_.8fr] gap-6">
          <aside className="panel">
            <p className="section-kicker">Next Signals</p>
            <h2 className="text-2xl mt-3">下周继续观察</h2>
            <ul className="grid sm:grid-cols-2 gap-4 mt-5">
              {watchPoints.map((point) => <li key={point} className="border-l-2 border-primary pl-4 text-sm leading-6">{point}</li>)}
            </ul>
          </aside>
          <aside className="panel">
            <p className="section-kicker">Coverage Notes</p>
            <h2 className="text-2xl mt-3">覆盖缺口</h2>
            {metrics.coverageGaps?.length ? (
              <ul className="space-y-3 mt-5 text-sm text-text-secondary">
                {metrics.coverageGaps.map((gap) => <li key={gap}>— {gap}</li>)}
              </ul>
            ) : <p className="text-sm text-text-secondary mt-5">本周主要来源运行正常。</p>}
          </aside>
        </section>

        <section id="evidence" className="border-t border-border pt-10">
          <div className="panel-heading">
            <div><p className="section-kicker">Evidence Index</p><h2 className="text-3xl mt-2">证据与来源</h2></div>
            <span className="text-xs text-text-secondary">所有结论仅使用以下公开来源</span>
          </div>
          {evidence.length ? (
            <div className="divide-y divide-border">
              {evidence.map((item) => (
                <div key={item.id} id={`evidence-${item.id}`} className="grid md:grid-cols-[7rem_1fr_auto] gap-4 py-5 scroll-mt-24">
                  <div><span className="text-xs text-primary font-bold">{item.category}</span><time className="block text-[11px] text-text-tertiary mt-2">{item.publishedAt.slice(0, 10)}</time></div>
                  <div><Link href={item.internalUrl} className="font-semibold hover:text-primary">{item.title}</Link><p className="text-xs text-text-secondary mt-2">{item.sourceName}</p></div>
                  {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold self-center">原始来源 ↗</a>}
                </div>
              ))}
            </div>
          ) : <div className="panel text-text-secondary">当前没有足够的公开证据，完成下一轮采集后自动更新。</div>}
          <p className="text-xs text-text-tertiary leading-6 mt-6">统计说明：周报比较最近 7 日与此前 7 日；常规版本维护不进入核心判断；内容热度不等同于市场规模。AI 仅参与归纳表达，不补充外部事实。</p>
        </section>

        <section className="border-t border-border pt-10">
          <div className="panel-heading"><div><p className="section-kicker">Archive</p><h2 className="text-2xl mt-2">历史周报</h2></div></div>
          <div className="grid md:grid-cols-2 gap-3">
            {archive.map((item) => (
              <Link key={String(item.week_start)} href={`/reports?week=${item.week_start}`} className={`border p-5 ${String(item.week_start) === String(report.week_start) ? 'border-primary bg-primary-light' : 'border-border bg-card hover:border-primary'}`}>
                <span className="text-xs text-text-tertiary">{String(item.week_start)}</span>
                <strong className="block mt-2">{String(item.title)}</strong>
                <small className="block text-text-secondary mt-3">{String(item.generation_method) === 'ai' ? 'AI 辅助整理' : '规则分析'} · {Number(item.evidence_count || 0)} 条证据</small>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
