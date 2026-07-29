import Link from 'next/link';
import ArticleCard from '@/components/articles/article-card';
import { getDashboard } from '@/lib/analytics';
import { formatDate, LANGUAGE_MAP } from '@/lib/utils';
import { UPDATE_CATEGORIES } from '@/lib/content-intelligence';

export const dynamic = 'force-dynamic';

interface DashboardArticle {
  id: string;
  title: string;
  summary: string | null;
  source_name: string | null;
  language: string | null;
  tags: string | null;
  published_at: string | null;
  score: number | null;
}

interface DashboardUpdate {
  id: string;
  competitor_id: string;
  competitor_name: string;
  title: string;
  category: keyof typeof UPDATE_CATEGORIES;
  published_at: string | null;
}

interface DashboardExam {
  id: string;
  exam_type: string;
  title: string;
  language: string;
  exam_date: string | null;
  registration_end: string | null;
}

interface TopCompetitor {
  id: string;
  name: string;
  description: string;
  ranking: number;
}

export default function HomePage() {
  const data = getDashboard('7d');
  const overview = data.overview;

  return (
    <div>
      <section className="border-b border-border bg-[linear-gradient(135deg,#e9f2ff_0%,#ffffff_48%,#e6f8ff_100%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-primary mb-4">LANGUAGE MARKET WATCH</p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.08]">
              看懂小语种行业，
              <span className="block text-primary">也服务每一次学习选择。</span>
            </h1>
            <p className="text-lg text-text-secondary leading-8 mt-6 max-w-2xl">
              汇集官方考试安排、学习平台动态与精品内容。所有摘要和趋势均来自真实来源与规则统计，不使用 AI 生成。
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/competitors" className="px-5 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover">
                行业人员入口
              </Link>
              <Link href="/calendar" className="px-5 py-3 rounded-xl bg-white border border-border font-medium hover:border-primary/40">
                学习者入口
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <section>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
            <div>
              <p className="section-kicker">今日资讯概览</p>
              <h2 className="text-2xl font-bold mt-1">一眼掌握今天发生了什么</h2>
            </div>
            <p className="text-sm text-text-secondary bg-white border border-border rounded-full px-4 py-2">{data.dailyBrief}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '今日新增文章', value: overview.todayArticles, unit: '篇', href: '/articles?sort=date', action: '查看最新文章' },
              { label: '今日产品更新', value: overview.todayUpdates, unit: '条', href: '/competitors', action: '查看行业产品动态' },
              { label: '近 7 日活跃平台', value: overview.activePlatforms, unit: '个', href: '/competitors', action: '查看监控平台' },
              { label: '30 天内报名截止', value: overview.closingExams, unit: '项', href: '/calendar', action: '查看考试日历' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                aria-label={`${item.label}：${item.value}${item.unit}，${item.action}`}
                className="metric-card group block hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-text-secondary">{item.label}</p>
                  <span aria-hidden="true" className="text-primary transition-transform group-hover:translate-x-1">→</span>
                </div>
                <p className="text-3xl font-bold mt-3">{item.value}<span className="text-sm font-normal text-text-secondary ml-1">{item.unit}</span></p>
                <p className="text-xs text-primary mt-3">{item.action}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">行业情报</p>
                <h2 className="text-xl font-bold mt-1">重要产品动态</h2>
              </div>
              <Link href="/insights" className="text-sm text-primary">查看趋势 →</Link>
            </div>
            <div className="divide-y divide-border">
              {(data.recentUpdates as DashboardUpdate[]).map((update) => (
                <Link key={update.id} href={`/competitors/${update.competitor_id}`} className="flex gap-4 py-4 group">
                  <div className="w-10 h-10 rounded-xl bg-primary-light text-primary-dark flex items-center justify-center font-bold flex-none">
                    {update.competitor_name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mb-1">
                      <span className="text-primary-dark font-medium">{update.competitor_name}</span>
                      <span>{UPDATE_CATEGORIES[update.category] || '其他'}</span>
                      {update.published_at && <span>{formatDate(update.published_at)}</span>}
                    </div>
                    <p className="font-medium group-hover:text-primary line-clamp-2">{update.title}</p>
                  </div>
                </Link>
              ))}
              {data.recentUpdates.length === 0 && (
                <div>
                  <p className="text-sm text-text-secondary py-3">动态来源正在接入，先查看国内重点观察平台。</p>
                  {(data.topCompetitors as TopCompetitor[]).slice(0, 6).map((competitor) => (
                    <Link key={competitor.id} href={`/competitors/${competitor.id}`} className="flex gap-4 py-4 group">
                      <span className="w-10 h-10 rounded-xl bg-primary-light text-primary-dark flex items-center justify-center font-bold flex-none">
                        {competitor.ranking}
                      </span>
                      <span className="min-w-0">
                        <strong className="group-hover:text-primary">{competitor.name}</strong>
                        <span className="block text-sm text-text-secondary line-clamp-1 mt-1">{competitor.description}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">热点雷达</p>
                  <h2 className="text-xl font-bold mt-1">近 7 日趋势词</h2>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.keywords.map((item, index) => (
                  <Link
                    key={item.keyword}
                    href={`/articles?tag=${encodeURIComponent(item.keyword)}`}
                    className={`rounded-full px-3 py-2 text-sm ${index < 3 ? 'bg-primary text-white' : 'bg-muted text-text-secondary hover:text-primary'}`}
                  >
                    {item.keyword} · {item.count}
                  </Link>
                ))}
                {data.keywords.length === 0 && <p className="text-sm text-text-secondary">数据积累中</p>}
              </div>
            </div>
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">平台数据</p>
                  <h2 className="text-xl font-bold mt-1">数据库实时统计</h2>
                </div>
              </div>
              <dl className="space-y-3">
                {[
                  ['监控平台', `${overview.totalCompetitors} 个`],
                  ['收录文章', `${overview.totalArticles} 篇`],
                  ['覆盖语种', `${overview.totalLanguages} 种`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm border-b border-border pb-3">
                    <dt className="text-text-secondary">{label}</dt><dd className="font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section>
          <div className="panel-heading">
            <div>
              <p className="section-kicker">学习服务</p>
              <h2 className="text-2xl font-bold mt-1">考试节点与学习内容</h2>
            </div>
            <Link href="/calendar" className="text-sm text-primary">完整考试日历 →</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data.upcomingExams as DashboardExam[]).map((exam) => (
              <Link key={exam.id} href={`/calendar?language=${exam.language}`} className="metric-card group">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold tracking-wider text-primary">{exam.exam_type}</span>
                  <span className="text-xs text-text-secondary">{LANGUAGE_MAP[exam.language]}</span>
                </div>
                <h3 className="font-semibold mt-4 group-hover:text-primary">{exam.title}</h3>
                <p className="text-sm text-text-secondary mt-3">
                  {exam.exam_date ? `考试 ${formatDate(exam.exam_date)}` : '场次以官方实时查询为准'}
                </p>
                {exam.registration_end && <p className="text-xs text-amber-700 mt-1">报名截止 {formatDate(exam.registration_end)}</p>}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="panel-heading">
            <div>
              <p className="section-kicker">专题集合</p>
              <h2 className="text-2xl font-bold mt-1">按你的目标继续探索</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {data.topics.map((topic, index) => (
              <Link key={topic.value} href={`/articles?tag=${encodeURIComponent(topic.value)}`} className="topic-card">
                <span className="text-xs text-text-secondary">0{index + 1}</span>
                <strong>{topic.label}</strong>
                <span className="text-xs text-text-secondary">{topic.count} 篇内容</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="panel-heading">
            <div>
              <p className="section-kicker">编辑精选</p>
              <h2 className="text-2xl font-bold mt-1">热门学习文章</h2>
            </div>
            <Link href="/articles" className="text-sm text-primary">浏览全部 →</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(data.hotArticles as DashboardArticle[]).map((article) => <ArticleCard key={article.id} {...article} />)}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">语种专题</p>
              <h2 className="text-2xl font-bold mt-1">从一个语种出发</h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(LANGUAGE_MAP).filter(([key]) => !['multi', 'chinese'].includes(key)).map(([key, label]) => (
              <Link key={key} href={`/languages/${key}`} className="px-5 py-3 rounded-xl bg-muted hover:bg-primary-light hover:text-primary-dark font-medium">
                {label}专题
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
