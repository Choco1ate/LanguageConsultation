import { getDb, initDb } from './db';
import { extractKeywords, UPDATE_CATEGORIES } from './content-intelligence';
import { LANGUAGE_MAP, TAG_OPTIONS } from './utils';

export type AnalyticsRange = '7d' | '30d';

export function normalizeRange(value: string | null): AnalyticsRange {
  return value === '30d' ? '30d' : '7d';
}

export function getInsights(range: AnalyticsRange, language?: string | null) {
  initDb();
  const db = getDb();
  const days = range === '30d' ? 30 : 7;
  const languageClause = language && language !== 'all' ? ' AND language = ?' : '';
  const params = language && language !== 'all' ? [days - 1, language] : [days - 1];
  const articleRows = db.prepare(`
    SELECT title, summary, source_name, language, published_at
    FROM articles
    WHERE datetime(COALESCE(published_at, created_at)) >= datetime('now', '-' || ? || ' days')
    ${languageClause}
  `).all(...params) as Array<{
    title: string; summary: string | null; source_name: string | null;
    language: string | null; published_at: string | null;
  }>;

  const dailyRows = db.prepare(`
    SELECT date(COALESCE(published_at, created_at)) AS date, COUNT(*) AS count
    FROM articles
    WHERE datetime(COALESCE(published_at, created_at)) >= datetime('now', '-' || ? || ' days')
    ${languageClause}
    GROUP BY date(COALESCE(published_at, created_at))
  `).all(...params) as Array<{ date: string; count: number }>;
  const dailyMap = new Map(dailyRows.map((row) => [row.date, row.count]));
  const articleSeries = Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - index - 1));
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: dailyMap.get(key) || 0 };
  });

  const updateCategories = db.prepare(`
    SELECT cu.category, COUNT(*) AS count
    FROM competitor_updates cu
    JOIN competitors c ON c.id = cu.competitor_id
    WHERE datetime(COALESCE(cu.published_at, cu.created_at)) >= datetime('now', '-' || ? || ' days')
      AND c.market = 'cn' AND c.ranking BETWEEN 1 AND 10
    GROUP BY cu.category ORDER BY count DESC
  `).all(days - 1) as Array<{ category: string; count: number }>;

  const languageHeat = db.prepare(`
    SELECT language, COUNT(*) AS count
    FROM articles
    WHERE datetime(COALESCE(published_at, created_at)) >= datetime('now', '-' || ? || ' days')
    GROUP BY language ORDER BY count DESC
  `).all(days - 1) as Array<{ language: string; count: number }>;

  return {
    range,
    methodology: '仅统计本站已抓取内容；关键词分数综合出现次数、来源数量与时间衰减。',
    totals: {
      articles: articleRows.length,
      competitorUpdates: updateCategories.reduce((sum, row) => sum + row.count, 0),
    },
    articleSeries,
    updateCategories: updateCategories.map((row) => ({
      key: row.category || 'other',
      label: UPDATE_CATEGORIES[row.category as keyof typeof UPDATE_CATEGORIES] || '其他',
      count: row.count,
    })),
    languageHeat: languageHeat.map((row) => ({
      key: row.language || 'other',
      label: LANGUAGE_MAP[row.language] || row.language || '其他',
      count: row.count,
    })),
    keywords: extractKeywords(articleRows),
  };
}

export function getDashboard(range: AnalyticsRange) {
  initDb();
  const db = getDb();
  const days = range === '30d' ? 30 : 7;
  const todayArticles = (db.prepare(
    "SELECT COUNT(*) AS count FROM articles WHERE date(created_at, 'localtime') = date('now', 'localtime')"
  ).get() as { count: number }).count;
  const todayUpdates = (db.prepare(`
    SELECT COUNT(*) AS count FROM competitor_updates cu
    JOIN competitors c ON c.id = cu.competitor_id
    WHERE date(cu.created_at, 'localtime') = date('now', 'localtime')
      AND c.market = 'cn' AND c.ranking BETWEEN 1 AND 10
  `
  ).get() as { count: number }).count;
  const totalArticles = (db.prepare('SELECT COUNT(*) AS count FROM articles').get() as { count: number }).count;
  const totalCompetitors = (db.prepare(
    "SELECT COUNT(*) AS count FROM competitors WHERE market = 'cn' AND ranking BETWEEN 1 AND 10"
  ).get() as { count: number }).count;
  const totalLanguages = (db.prepare(
    "SELECT COUNT(DISTINCT language) AS count FROM articles WHERE language IS NOT NULL AND language NOT IN ('multi', 'chinese')"
  ).get() as { count: number }).count;
  const activePlatforms = (db.prepare(`
    SELECT COUNT(DISTINCT cu.competitor_id) AS count FROM competitor_updates cu
    JOIN competitors c ON c.id = cu.competitor_id
    WHERE datetime(COALESCE(cu.published_at, cu.created_at)) >= datetime('now', '-' || ? || ' days')
      AND c.market = 'cn' AND c.ranking BETWEEN 1 AND 10
  `).get(days - 1) as { count: number }).count;
  const closingExams = (db.prepare(`
    SELECT COUNT(*) AS count FROM exam_events
    WHERE registration_end BETWEEN date('now') AND date('now', '+30 days')
  `).get() as { count: number }).count;

  const recentUpdates = db.prepare(`
    SELECT cu.*, c.name AS competitor_name
    FROM competitor_updates cu JOIN competitors c ON c.id = cu.competitor_id
    WHERE c.market = 'cn' AND c.ranking BETWEEN 1 AND 10
    ORDER BY cu.importance DESC, datetime(COALESCE(cu.published_at, cu.created_at)) DESC LIMIT 6
  `).all();
  const topCompetitors = db.prepare(`
    SELECT id, name, description, language, type, ranking, url
    FROM competitors
    WHERE market = 'cn' AND ranking BETWEEN 1 AND 10
    ORDER BY ranking ASC
  `).all();
  const hotArticles = db.prepare(`
    SELECT id, title, summary, source_name, language, tags, published_at, score
    FROM articles ORDER BY score DESC, datetime(COALESCE(published_at, created_at)) DESC LIMIT 6
  `).all();
  const upcomingExams = db.prepare(`
    SELECT * FROM exam_events
    WHERE exam_date IS NULL OR exam_date >= date('now')
    ORDER BY exam_date IS NULL, exam_date ASC LIMIT 6
  `).all();
  const sourceHealth = db.prepare(`
    SELECT sr.* FROM scraper_runs sr
    INNER JOIN (
      SELECT source_type, source_name, MAX(finished_at) AS max_finished
      FROM scraper_runs GROUP BY source_type, source_name
    ) latest ON latest.source_type = sr.source_type
      AND latest.source_name = sr.source_name AND latest.max_finished = sr.finished_at
    ORDER BY sr.finished_at DESC LIMIT 12
  `).all();
  const topics = TAG_OPTIONS.map((topic) => ({
    ...topic,
    count: (db.prepare('SELECT COUNT(*) AS count FROM articles WHERE tags LIKE ?')
      .get(`%${topic.value}%`) as { count: number }).count,
  }));
  const insights = getInsights(range);

  return {
    range,
    overview: {
      todayArticles, todayUpdates, closingExams, totalArticles,
      totalCompetitors, totalLanguages, activePlatforms,
    },
    dailyBrief: `今日新增 ${todayArticles} 篇文章、${todayUpdates} 条行业产品更新，${closingExams} 项考试将在 30 天内截止报名。`,
    recentUpdates,
    topCompetitors,
    hotArticles,
    upcomingExams,
    topics,
    sourceHealth,
    keywords: insights.keywords,
    updateCategories: insights.updateCategories,
    languageHeat: insights.languageHeat,
  };
}
