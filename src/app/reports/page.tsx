import Link from 'next/link';
import { getLatestWeeklyReport } from '@/lib/editorial';

export const dynamic = 'force-dynamic';

type Section = { heading: string; analysis: string; sourceIds: string[] };

export default function ReportsPage() {
  const report = getLatestWeeklyReport();
  if (!report) {
    return (
      <div className="editorial-page">
        <div className="page-rule py-12">
          <p className="eyebrow">Weekly Intelligence</p>
          <h1 className="text-4xl md:text-6xl mt-3">本周观察</h1>
          <p className="text-text-secondary mt-5">本周情报仍在整理中。完成首轮内容增强后，这里将形成来源可追溯的行业周报。</p>
        </div>
      </div>
    );
  }
  const sections = report.sections as Section[];
  const watchPoints = report.watch_points as string[];
  return (
    <article className="editorial-page max-w-5xl">
      <header className="page-rule py-10">
        <p className="eyebrow">Weekly Intelligence / {String(report.week_start)}</p>
        <h1 className="text-4xl md:text-6xl leading-tight mt-4">{String(report.title)}</h1>
        <p className="editorial-title text-xl md:text-2xl text-text-secondary leading-9 mt-6">{String(report.thesis)}</p>
        <p className="text-[10px] text-text-tertiary mt-5">AI 辅助整理 · 结论仅基于站内已验证来源</p>
      </header>
      <div className="py-10 space-y-10">
        {sections.map((section, index) => (
          <section key={section.heading} className="grid md:grid-cols-[4rem_1fr] gap-5">
            <span className="text-primary text-xl font-bold">0{index + 1}</span>
            <div><h2 className="text-3xl">{section.heading}</h2><p className="text-text-secondary leading-8 mt-4">{section.analysis}</p></div>
          </section>
        ))}
        <aside className="panel">
          <p className="section-kicker">Next Signals</p>
          <h2 className="text-2xl mt-3">下周继续观察</h2>
          <ul className="grid md:grid-cols-2 gap-4 mt-5">
            {watchPoints.map((point) => <li key={point} className="border-l-2 border-primary pl-4 text-sm leading-6">{point}</li>)}
          </ul>
        </aside>
        <Link href="/insights" className="text-primary font-bold">查看趋势看板 →</Link>
      </div>
    </article>
  );
}
