import Link from 'next/link';
import ArticleCard from '@/components/articles/article-card';
import { getDashboard } from '@/lib/analytics';
import { formatDate, LANGUAGE_MAP } from '@/lib/utils';
import { UPDATE_CATEGORIES } from '@/lib/content-intelligence';

export const dynamic = 'force-dynamic';

type Update = { id: string; competitor_id: string; competitor_name: string; title: string; category: keyof typeof UPDATE_CATEGORIES; published_at: string | null };
type Article = { id: string; title: string; summary: string | null; source_name: string | null; language: string | null; tags: string | null; published_at: string | null; score: number | null };
type Exam = { id: string; exam_type: string; title: string; language: string; exam_date: string | null; registration_end: string | null };

export default function HomePage() {
  const data = getDashboard('7d');
  const { overview } = data;
  const updates = data.recentUpdates as Update[];
  const articles = data.hotArticles as Article[];
  const lead = articles[0];

  return (
    <div className="editorial-page">
      <section className="page-rule py-3 flex flex-wrap items-center justify-between gap-3 text-[11px] tracking-wider text-text-secondary">
        <span>行业研究 · 学习服务 · 公开来源</span>
        <span>{new Intl.DateTimeFormat('zh-CN', { dateStyle: 'full' }).format(new Date())}</span>
        <span className="flex items-center gap-2"><span className="status-dot" /> 今日数据库已更新</span>
      </section>

      <section className="grid lg:grid-cols-[1.55fr_.8fr] border-b border-foreground mt-7">
        <div className="lg:pr-10 lg:border-r border-border pb-8">
          <p className="eyebrow mb-5">Language Market Watch / Daily Brief</p>
          <h1 className="text-[clamp(2.35rem,4.8vw,4.85rem)] leading-[1.04] font-semibold max-w-4xl">
            看懂小语种行业<span className="text-primary">，</span><br />领先每一次变化。
          </h1>
          <p className="text-base md:text-lg text-text-secondary leading-8 mt-7 max-w-2xl">
            从产品发布、平台动作到内容趋势，我们把分散的行业信号整理成可验证、可追踪的每日情报。
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/competitors" className="bg-foreground text-background px-5 py-3 text-sm font-bold hover:bg-primary">进入产品情报库</Link>
            <Link href="/insights" className="border border-foreground px-5 py-3 text-sm font-bold hover:bg-muted">阅读趋势报告</Link>
          </div>
        </div>
        <aside className="lg:pl-8 py-8 lg:py-0">
          <p className="section-kicker">今日摘要</p>
          <p className="editorial-title text-2xl leading-snug mt-5">{data.dailyBrief}</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 mt-8 pt-6 border-t border-border">
            {[
              ['新增文章', `${overview.todayArticles} 篇`],
              ['产品更新', `${overview.todayUpdates} 条`],
              ['活跃平台', `${overview.activePlatforms} 个`],
              ['报名截止', `${overview.closingExams} 项`],
            ].map(([label, value]) => (
              <div key={label}><dt className="text-[11px] text-text-secondary">{label}</dt><dd className="text-2xl font-bold mt-1">{value}</dd></div>
            ))}
          </dl>
        </aside>
      </section>

      <section className="py-10 grid lg:grid-cols-[1.45fr_.75fr] gap-10 border-b border-border">
        <div>
          <div className="panel-heading">
            <div><p className="section-kicker">产品情报</p><h2 className="text-3xl mt-2">值得关注的行业动作</h2></div>
            <Link href="/competitors" className="text-sm text-primary font-bold">全部动态 →</Link>
          </div>
          <div className="divide-y divide-border">
            {updates.slice(0, 6).map((item, index) => (
              <Link key={item.id} href={`/competitors/${item.competitor_id}`} className="grid grid-cols-[2rem_1fr] sm:grid-cols-[2rem_7rem_1fr_auto] gap-3 py-5 items-start group">
                <span className="text-xs text-text-tertiary pt-1">{String(index + 1).padStart(2, '0')}</span>
                <strong className="text-sm text-primary-dark">{item.competitor_name}</strong>
                <span className="font-semibold group-hover:text-primary">{item.title}</span>
                <span className="hidden sm:block text-xs text-text-tertiary">{item.published_at ? formatDate(item.published_at) : UPDATE_CATEGORIES[item.category]}</span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="panel self-start">
          <p className="section-kicker">趋势雷达</p>
          <h2 className="text-2xl mt-3">近 7 日高频信号</h2>
          <div className="mt-5 space-y-3">
            {data.keywords.slice(0, 7).map((item, index) => (
              <Link key={item.keyword} href={`/articles?tag=${encodeURIComponent(item.keyword)}`} className="flex items-center gap-3 group">
                <span className="text-xs w-4">{index + 1}</span>
                <span className="flex-1 text-sm font-medium group-hover:text-primary">{item.keyword}</span>
                <span className="h-1 bg-primary" style={{ width: `${Math.max(12, Math.min(80, item.count * 12))}%` }} />
                <span className="text-xs text-text-tertiary">{item.count}</span>
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-3 mt-7 pt-5 border-t border-border text-center">
            {[['平台', overview.totalCompetitors], ['文章', overview.totalArticles], ['语种', overview.totalLanguages]].map(([label, value]) => (
              <div key={label}><strong className="block text-xl">{value}</strong><span className="text-[10px] text-text-secondary">{label}</span></div>
            ))}
          </div>
        </aside>
      </section>

      <section className="py-10 border-b border-border">
        <div className="panel-heading">
          <div><p className="section-kicker">编辑精选</p><h2 className="text-3xl mt-2">今天值得读</h2></div>
          <Link href="/articles" className="text-sm text-primary font-bold">进入文章库 →</Link>
        </div>
        {lead && (
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 py-6 border-b border-border">
            <div className="min-h-64 bg-foreground text-background p-7 flex flex-col justify-between relative overflow-hidden">
              <span className="absolute right-[-2rem] top-[-4rem] text-[14rem] font-serif opacity-[.06]">语</span>
              <p className="eyebrow">Lead Story</p>
              <div><h3 className="text-3xl md:text-4xl leading-tight">{lead.title}</h3><p className="mt-4 text-sm opacity-70">{lead.source_name} · {lead.published_at ? formatDate(lead.published_at) : '最新收录'}</p></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {articles.slice(1, 5).map((article) => <ArticleCard key={article.id} {...article} />)}
            </div>
          </div>
        )}
      </section>

      <section className="py-10 grid lg:grid-cols-[1.3fr_.7fr] gap-10">
        <div>
          <div className="panel-heading"><div><p className="section-kicker">考试与学习</p><h2 className="text-3xl mt-2">近期关键节点</h2></div><Link href="/calendar" className="text-sm text-primary font-bold">完整日历 →</Link></div>
          <div className="grid md:grid-cols-2 gap-3 mt-5">
            {(data.upcomingExams as Exam[]).slice(0, 4).map((exam) => (
              <Link key={exam.id} href={`/calendar?language=${exam.language}`} className="metric-card">
                <div className="flex justify-between text-xs"><b className="text-primary">{exam.exam_type}</b><span className="text-text-secondary">{LANGUAGE_MAP[exam.language]}</span></div>
                <h3 className="text-lg mt-4">{exam.title}</h3>
                <p className="text-xs text-text-secondary mt-3">{exam.exam_date ? `考试 ${formatDate(exam.exam_date)}` : '以官方信息为准'}</p>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className="panel-heading"><div><p className="section-kicker">专题索引</p><h2 className="text-2xl mt-2">快速探索</h2></div></div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            {data.topics.slice(0, 6).map((topic, index) => (
              <Link key={topic.value} href={`/articles?tag=${encodeURIComponent(topic.value)}`} className="topic-card">
                <span className="text-[10px] text-text-tertiary">0{index + 1}</span><strong>{topic.label}</strong><span className="text-xs text-text-secondary">{topic.count} 篇</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
