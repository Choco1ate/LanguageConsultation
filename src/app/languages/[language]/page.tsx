import Link from 'next/link';
import { notFound } from 'next/navigation';
import ArticleCard from '@/components/articles/article-card';
import CompetitorCard from '@/components/competitors/competitor-card';
import { getDb, initDb } from '@/lib/db';
import { formatDate, LANGUAGE_MAP } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const supportedLanguages = ['japanese', 'korean', 'french', 'german', 'spanish', 'english'];

export function generateStaticParams() {
  return supportedLanguages.map((language) => ({ language }));
}

export default async function LanguagePage({ params }: { params: Promise<{ language: string }> }) {
  const { language } = await params;
  if (!supportedLanguages.includes(language)) notFound();
  initDb();
  const db = getDb();
  const articles = db.prepare(`
    SELECT id, title, summary, source_name, language, tags, published_at, score
    FROM articles WHERE language = ? ORDER BY score DESC, published_at DESC LIMIT 6
  `).all(language) as Array<React.ComponentProps<typeof ArticleCard>>;
  const competitors = db.prepare(`
    SELECT c.*,
      (SELECT title FROM competitor_updates WHERE competitor_id = c.id ORDER BY published_at DESC LIMIT 1) AS latest_update_title,
      (SELECT published_at FROM competitor_updates WHERE competitor_id = c.id ORDER BY published_at DESC LIMIT 1) AS latest_update_date,
      (SELECT COUNT(*) FROM competitor_updates WHERE competitor_id = c.id) AS update_count
    FROM competitors c
    WHERE c.market = 'cn' AND c.ranking BETWEEN 1 AND 10
      AND (c.language = ? OR c.language = 'multi')
    ORDER BY c.ranking ASC LIMIT 6
  `).all(language) as Array<React.ComponentProps<typeof CompetitorCard>>;
  const exams = db.prepare(`
    SELECT * FROM exam_events WHERE language = ?
    ORDER BY exam_date IS NULL, exam_date ASC LIMIT 4
  `).all(language) as Array<{ id: string; exam_type: string; title: string; exam_date: string | null }>;
  const label = LANGUAGE_MAP[language];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <section className="rounded-3xl border border-border bg-[linear-gradient(135deg,#ffffff,#e6f1ff)] p-8 md:p-12">
        <p className="section-kicker">Language Hub</p>
        <h1 className="text-4xl md:text-5xl font-bold mt-3">{label}专题</h1>
        <p className="text-text-secondary mt-4 max-w-2xl">聚合 {label}相关学习平台、考试安排、精品文章与近期行业动态。</p>
        <div className="flex flex-wrap gap-3 mt-7">
          <Link href={`/articles?language=${language}`} className="px-5 py-2.5 rounded-xl bg-primary text-white">查看全部{label}文章</Link>
          <Link href={`/calendar?language=${language}`} className="px-5 py-2.5 rounded-xl bg-white border border-border">查看{label}考试</Link>
        </div>
      </section>

      <section>
        <div className="panel-heading"><h2 className="text-2xl font-bold">近期考试</h2></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {exams.map((exam) => (
            <Link key={exam.id} href={`/calendar?language=${language}`} className="metric-card">
              <p className="text-xs font-bold text-primary">{exam.exam_type}</p>
              <h3 className="font-semibold mt-3">{exam.title}</h3>
              <p className="text-sm text-text-secondary mt-2">{exam.exam_date ? formatDate(exam.exam_date) : '查看官方实时场次'}</p>
            </Link>
          ))}
          {exams.length === 0 && <div className="metric-card text-text-secondary">暂未收录考试安排</div>}
        </div>
      </section>

      <section>
        <div className="panel-heading"><h2 className="text-2xl font-bold">相关平台</h2><Link href={`/competitors?language=${language}`} className="text-sm text-primary">全部平台 →</Link></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {competitors.map((competitor) => <CompetitorCard key={competitor.id} {...competitor} />)}
        </div>
      </section>

      <section>
        <div className="panel-heading"><h2 className="text-2xl font-bold">热门文章</h2><Link href={`/articles?language=${language}`} className="text-sm text-primary">全部文章 →</Link></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article) => <ArticleCard key={article.id} {...article} />)}
        </div>
      </section>
    </div>
  );
}
