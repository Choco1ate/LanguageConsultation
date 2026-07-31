import { randomUUID } from 'crypto';
import { getDb, initDb } from './db';
import { extractKeywords, UPDATE_CATEGORIES } from './content-intelligence';
import { LANGUAGE_MAP } from './utils';

export type TrendRange = '7d' | '30d';

export type TrendEvidence = {
  id: string;
  entityType: 'article' | 'competitor_update';
  title: string;
  sourceName: string;
  sourceUrl: string;
  internalUrl: string;
  category: string;
  publishedAt: string;
};

type Change = {
  current: number;
  previous: number;
  delta: number | null;
  direction: 'up' | 'down' | 'flat' | 'insufficient';
  label: string;
};

export type TrendFinding = {
  id: string;
  title: string;
  insight: string;
  impact: string;
  subject: string;
  change: Change;
  confidence: 'high' | 'medium' | 'low';
  evidenceIds: string[];
  evidenceCount: number;
};

const SUPPORTED_LANGUAGES = new Set(['all', 'japanese', 'korean', 'french', 'german', 'spanish', 'english', 'multi']);
const EXCLUDED_RUN_SOURCES = ['中国教育考试网', '网易留学', '新东方留学'];

export function normalizeTrendLanguage(value?: string | null) {
  return value && SUPPORTED_LANGUAGES.has(value) ? value : 'all';
}

function parseJson<T>(value: unknown, fallback: T): T {
  try {
    return typeof value === 'string' ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function makeChange(current: number, previous: number): Change {
  const enoughData = current + previous >= 3;
  if (!enoughData) {
    return { current, previous, delta: null, direction: 'insufficient', label: '样本不足' };
  }
  if (previous === 0) {
    return { current, previous, delta: null, direction: 'up', label: `本期新增 ${current}` };
  }
  const delta = Math.round(((current - previous) / previous) * 100);
  return {
    current,
    previous,
    delta,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
    label: delta === 0 ? '与上期持平' : `较上期${delta > 0 ? '增加' : '减少'} ${Math.abs(delta)}%`,
  };
}

export function buildTrendAnalysis(range: TrendRange, requestedLanguage?: string | null) {
  initDb();
  const db = getDb();
  const language = normalizeTrendLanguage(requestedLanguage);
  const days = range === '30d' ? 30 : 7;
  const periodEnd = new Date().toISOString();
  const currentStart = isoDaysAgo(days);
  const previousStart = isoDaysAgo(days * 2);
  const articleLanguageSql = language === 'all' ? '' : ' AND a.language = ?';
  const articleLanguageParams = language === 'all' ? [] : [language];
  const updateLanguageSql = language === 'all' ? '' : " AND (c.language = ? OR c.language = 'multi')";
  const updateLanguageParams = language === 'all' ? [] : [language];

  const articleRows = db.prepare(`
    SELECT a.id, a.title, a.summary, a.source_name, a.source_url, a.language,
      a.category, a.published_at, a.created_at
    FROM articles a
    WHERE COALESCE(a.language, '') != 'chinese'
      AND datetime(COALESCE(a.published_at, a.created_at)) >= datetime(?)
      AND datetime(COALESCE(a.published_at, a.created_at)) < datetime(?)
      ${articleLanguageSql}
    ORDER BY datetime(COALESCE(a.published_at, a.created_at)) DESC
  `).all(currentStart, periodEnd, ...articleLanguageParams) as Array<Record<string, unknown>>;
  const previousArticleRows = db.prepare(`
    SELECT a.id, a.title, a.summary, a.source_name, a.source_url, a.language,
      a.category, a.published_at, a.created_at
    FROM articles a
    WHERE COALESCE(a.language, '') != 'chinese'
      AND datetime(COALESCE(a.published_at, a.created_at)) >= datetime(?)
      AND datetime(COALESCE(a.published_at, a.created_at)) < datetime(?)
      ${articleLanguageSql}
  `).all(previousStart, currentStart, ...articleLanguageParams) as Array<Record<string, unknown>>;
  const previousArticleCount = previousArticleRows.length;

  const updateRows = db.prepare(`
    SELECT cu.id, cu.title, cu.content, cu.category, cu.source_channel,
      cu.source_url, cu.published_at, cu.created_at, cu.importance,
      c.id AS competitor_id, c.name AS competitor_name
    FROM competitor_updates cu
    JOIN competitors c ON c.id = cu.competitor_id
    WHERE c.market = 'cn' AND c.ranking BETWEEN 1 AND 10
      AND cu.category != 'version_maintenance'
      AND datetime(COALESCE(cu.published_at, cu.created_at)) >= datetime(?)
      AND datetime(COALESCE(cu.published_at, cu.created_at)) < datetime(?)
      ${updateLanguageSql}
    ORDER BY datetime(COALESCE(cu.published_at, cu.created_at)) DESC, cu.importance DESC
  `).all(currentStart, periodEnd, ...updateLanguageParams) as Array<Record<string, unknown>>;
  const previousUpdateCount = (db.prepare(`
    SELECT COUNT(*) AS count FROM competitor_updates cu
    JOIN competitors c ON c.id = cu.competitor_id
    WHERE c.market = 'cn' AND c.ranking BETWEEN 1 AND 10
      AND cu.category != 'version_maintenance'
      AND datetime(COALESCE(cu.published_at, cu.created_at)) >= datetime(?)
      AND datetime(COALESCE(cu.published_at, cu.created_at)) < datetime(?)
      ${updateLanguageSql}
  `).get(previousStart, currentStart, ...updateLanguageParams) as { count: number }).count;

  const platformRows = db.prepare(`
    SELECT c.id, c.name,
      SUM(CASE WHEN datetime(COALESCE(cu.published_at, cu.created_at)) >= datetime(?) THEN 1 ELSE 0 END) AS current_count,
      SUM(CASE WHEN datetime(COALESCE(cu.published_at, cu.created_at)) < datetime(?)
        AND datetime(COALESCE(cu.published_at, cu.created_at)) >= datetime(?) THEN 1 ELSE 0 END) AS previous_count,
      COUNT(DISTINCT CASE WHEN datetime(COALESCE(cu.published_at, cu.created_at)) >= datetime(?) THEN cu.category END) AS category_count,
      MAX(COALESCE(cu.published_at, cu.created_at)) AS latest_update
    FROM competitors c
    LEFT JOIN competitor_updates cu ON cu.competitor_id = c.id AND cu.category != 'version_maintenance'
      AND datetime(COALESCE(cu.published_at, cu.created_at)) >= datetime(?)
    WHERE c.market = 'cn' AND c.ranking BETWEEN 1 AND 10 ${language === 'all' ? '' : "AND (c.language = ? OR c.language = 'multi')"}
    GROUP BY c.id
    ORDER BY current_count DESC, latest_update DESC, c.ranking ASC
  `).all(currentStart, currentStart, previousStart, currentStart, previousStart, ...updateLanguageParams) as Array<Record<string, unknown>>;

  const categoryRows = db.prepare(`
    SELECT cu.category,
      SUM(CASE WHEN datetime(COALESCE(cu.published_at, cu.created_at)) >= datetime(?) THEN 1 ELSE 0 END) AS current_count,
      SUM(CASE WHEN datetime(COALESCE(cu.published_at, cu.created_at)) < datetime(?)
        AND datetime(COALESCE(cu.published_at, cu.created_at)) >= datetime(?) THEN 1 ELSE 0 END) AS previous_count
    FROM competitor_updates cu JOIN competitors c ON c.id = cu.competitor_id
    WHERE c.market = 'cn' AND c.ranking BETWEEN 1 AND 10
      AND cu.category != 'version_maintenance'
      AND datetime(COALESCE(cu.published_at, cu.created_at)) >= datetime(?)
      ${updateLanguageSql}
    GROUP BY cu.category ORDER BY current_count DESC
  `).all(currentStart, currentStart, previousStart, previousStart, ...updateLanguageParams) as Array<Record<string, unknown>>;

  const languageRows = db.prepare(`
    SELECT a.language,
      SUM(CASE WHEN datetime(COALESCE(a.published_at, a.created_at)) >= datetime(?) THEN 1 ELSE 0 END) AS current_count,
      SUM(CASE WHEN datetime(COALESCE(a.published_at, a.created_at)) < datetime(?)
        AND datetime(COALESCE(a.published_at, a.created_at)) >= datetime(?) THEN 1 ELSE 0 END) AS previous_count
    FROM articles a
    WHERE COALESCE(a.language, '') != 'chinese'
      AND datetime(COALESCE(a.published_at, a.created_at)) >= datetime(?)
      ${articleLanguageSql}
    GROUP BY a.language ORDER BY current_count DESC
  `).all(currentStart, currentStart, previousStart, previousStart, ...articleLanguageParams) as Array<Record<string, unknown>>;

  const representativeArticles = new Map<string, Record<string, unknown>>();
  articleRows.slice(0, 12).forEach((row) => representativeArticles.set(String(row.id), row));
  languageRows.forEach((languageRow) => {
    articleRows.filter((row) => row.language === languageRow.language).slice(0, 2)
      .forEach((row) => representativeArticles.set(String(row.id), row));
  });
  const evidence: TrendEvidence[] = [
    ...updateRows.map((row) => ({
      id: String(row.id),
      entityType: 'competitor_update' as const,
      title: String(row.title),
      sourceName: String(row.source_channel || row.competitor_name || '官方来源'),
      sourceUrl: String(row.source_url || ''),
      internalUrl: `/competitors/${row.competitor_id}`,
      category: UPDATE_CATEGORIES[String(row.category) as keyof typeof UPDATE_CATEGORIES] || '产品动态',
      publishedAt: String(row.published_at || row.created_at || ''),
    })),
    ...[...representativeArticles.values()].map((row) => ({
      id: String(row.id),
      entityType: 'article' as const,
      title: String(row.title),
      sourceName: String(row.source_name || '公开来源'),
      sourceUrl: String(row.source_url || ''),
      internalUrl: `/articles/${row.id}`,
      category: String(row.category || '行业文章'),
      publishedAt: String(row.published_at || row.created_at || ''),
    })),
  ].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 24);

  const findings: TrendFinding[] = [];
  const keywordSignals = extractKeywords(articleRows.map((row) => ({
    title: String(row.title),
    summary: String(row.summary || ''),
    source_name: String(row.source_name || ''),
    published_at: String(row.published_at || row.created_at || ''),
  })), 8);
  const previousKeywordSignals = extractKeywords(previousArticleRows.map((row) => ({
    title: String(row.title),
    summary: String(row.summary || ''),
    source_name: String(row.source_name || ''),
    published_at: String(row.published_at || row.created_at || ''),
  })), 20);
  const updateChange = makeChange(updateRows.length, previousUpdateCount);
  if (updateRows.length || previousUpdateCount) {
    findings.push({
      id: 'platform-movement',
      title: updateChange.direction === 'insufficient' ? '平台有效动作样本仍少' : `平台有效动作${updateChange.direction === 'down' ? '放缓' : '升温'}`,
      insight: `本期监测到 ${updateRows.length} 条非维护类产品动态，${updateChange.label}。`,
      impact: '功能、价格、课程与合作动作比常规版本维护更能反映平台真实经营方向。',
      subject: '国内 Top 10 平台',
      change: updateChange,
      confidence: updateRows.length + previousUpdateCount >= 6 ? 'high' : 'low',
      evidenceIds: updateRows.slice(0, 6).map((row) => String(row.id)),
      evidenceCount: updateRows.length,
    });
  }

  const articleChange = makeChange(articleRows.length, previousArticleCount);
  if (articleRows.length || previousArticleCount) {
    findings.push({
      id: 'content-demand',
      title: '行业内容关注度出现变化',
      insight: `本期收录 ${articleRows.length} 篇有效内容，${articleChange.label}。`,
      impact: '内容增量可辅助判断考试节点、学习需求和语种关注度，但不直接等同于市场规模。',
      subject: language === 'all' ? '全部小语种' : (LANGUAGE_MAP[language] || language),
      change: articleChange,
      confidence: articleRows.length + previousArticleCount >= 10 ? 'medium' : 'low',
      evidenceIds: articleRows.slice(0, 6).map((row) => String(row.id)),
      evidenceCount: articleRows.length,
    });
  }

  const topPlatform = platformRows.find((row) => Number(row.current_count) > 0);
  if (topPlatform) {
    const platformEvidence = updateRows.filter((row) => row.competitor_id === topPlatform.id);
    findings.push({
      id: `platform-${topPlatform.id}`,
      title: `${topPlatform.name} 是本期最活跃平台`,
      insight: `监测到 ${Number(topPlatform.current_count)} 条有效动作，覆盖 ${Number(topPlatform.category_count)} 类信号。`,
      impact: '持续、跨类型的更新通常比单次版本发布更值得跟踪。',
      subject: String(topPlatform.name),
      change: makeChange(Number(topPlatform.current_count), Number(topPlatform.previous_count)),
      confidence: Number(topPlatform.current_count) >= 3 ? 'medium' : 'low',
      evidenceIds: platformEvidence.map((row) => String(row.id)).slice(0, 6),
      evidenceCount: platformEvidence.length,
    });
  }

  const leadingLanguages = languageRows.filter((row) => Number(row.current_count) > 0).slice(0, 2);
  leadingLanguages.forEach((topLanguage, index) => {
    const languageEvidence = articleRows.filter((row) => row.language === topLanguage.language);
    findings.push({
      id: `language-${topLanguage.language}`,
      title: index === 0
        ? `${LANGUAGE_MAP[String(topLanguage.language)] || topLanguage.language}内容信号最集中`
        : `${LANGUAGE_MAP[String(topLanguage.language)] || topLanguage.language}保持较高关注度`,
      insight: `本期收录 ${Number(topLanguage.current_count)} 篇，${makeChange(Number(topLanguage.current_count), Number(topLanguage.previous_count)).label}。`,
      impact: '反映本站公开来源中的内容供给和近期议题密度，不代表完整市场份额。',
      subject: LANGUAGE_MAP[String(topLanguage.language)] || String(topLanguage.language),
      change: makeChange(Number(topLanguage.current_count), Number(topLanguage.previous_count)),
      confidence: Number(topLanguage.current_count) >= 5 ? 'medium' : 'low',
      evidenceIds: languageEvidence.slice(0, 6).map((row) => String(row.id)),
      evidenceCount: languageEvidence.length,
    });
  });
  const topKeyword = keywordSignals[0];
  if (topKeyword) {
    const previousKeyword = previousKeywordSignals.find((item) => item.keyword === topKeyword.keyword);
    const keywordEvidence = articleRows.filter((row) =>
      `${row.title} ${row.summary || ''}`.toLocaleLowerCase().includes(topKeyword.keyword.toLocaleLowerCase())
    );
    findings.push({
      id: `topic-${topKeyword.keyword}`,
      title: `“${topKeyword.keyword}”成为本期高频主题`,
      insight: `在 ${topKeyword.sourceCount} 个来源中出现 ${topKeyword.count} 次，${makeChange(topKeyword.count, previousKeyword?.count || 0).label}。`,
      impact: '高频主题反映公开内容供给的集中方向，应结合来源数量和时间节点判断。',
      subject: topKeyword.keyword,
      change: makeChange(topKeyword.count, previousKeyword?.count || 0),
      confidence: topKeyword.sourceCount >= 2 ? 'medium' : 'low',
      evidenceIds: keywordEvidence.slice(0, 6).map((row) => String(row.id)),
      evidenceCount: keywordEvidence.length,
    });
  }

  const latestRuns = db.prepare(`
    WITH latest AS (
      SELECT source_type, source_name, MAX(finished_at) AS latest_at
      FROM scraper_runs
      WHERE source_name NOT IN (${EXCLUDED_RUN_SOURCES.map(() => '?').join(',')})
      GROUP BY source_type, source_name
    )
    SELECT sr.source_type, sr.source_name, sr.status, sr.fetched_count, sr.finished_at
    FROM scraper_runs sr JOIN latest l
      ON l.source_type=sr.source_type AND l.source_name=sr.source_name AND l.latest_at=sr.finished_at
  `).all(...EXCLUDED_RUN_SOURCES) as Array<Record<string, unknown>>;
  const successfulSources = latestRuns.filter((row) => row.status === 'success');
  const failedSources = latestRuns.filter((row) => row.status === 'error');
  const latestUpdate = successfulSources.map((row) => String(row.finished_at)).sort().at(-1) || '';
  const freshnessHours = latestUpdate ? Math.max(0, Math.round((Date.now() - new Date(latestUpdate).getTime()) / 3_600_000)) : null;
  const inactivePlatforms = platformRows.filter((row) => Number(row.current_count) === 0).map((row) => String(row.name));
  const coverage = {
    monitoredPlatforms: platformRows.length,
    activePlatforms: platformRows.filter((row) => Number(row.current_count) > 0).length,
    effectiveSources: successfulSources.length,
    failedSources: failedSources.length,
    successRate: latestRuns.length ? Math.round((successfulSources.length / latestRuns.length) * 100) : 0,
    latestUpdate,
    freshnessHours,
    freshness: freshnessHours === null ? 'unknown' : freshnessHours <= 48 ? 'fresh' : freshnessHours <= 168 ? 'aging' : 'stale',
    gaps: [
      ...(failedSources.length ? [`${failedSources.length} 个来源最近抓取失败`] : []),
      ...(inactivePlatforms.length ? [`${inactivePlatforms.length} 个平台本期暂无有效动作`] : []),
    ],
    failedSourceNames: failedSources.map((row) => String(row.source_name)).slice(0, 8),
  };

  const categorySignals = categoryRows.map((row) => ({
    key: String(row.category),
    label: UPDATE_CATEGORIES[String(row.category) as keyof typeof UPDATE_CATEGORIES] || '其他',
    change: makeChange(Number(row.current_count), Number(row.previous_count)),
    evidenceIds: updateRows.filter((item) => item.category === row.category).map((item) => String(item.id)),
  }));
  const languageSignals = languageRows.map((row) => ({
    key: String(row.language),
    label: LANGUAGE_MAP[String(row.language)] || String(row.language),
    change: makeChange(Number(row.current_count), Number(row.previous_count)),
  }));
  const availableEvidenceIds = new Set(evidence.map((item) => item.id));
  const supportedFindings = findings.map((finding) => {
    const evidenceIds = finding.evidenceIds.filter((id) => availableEvidenceIds.has(id));
    return { ...finding, evidenceIds, evidenceCount: evidenceIds.length };
  }).filter((finding) => finding.evidenceCount > 0);
  const enoughEvidence = evidence.length >= 3;
  const headline = enoughEvidence
    ? `${days} 日行业信号：${supportedFindings[0]?.title || '公开来源持续更新'}`
    : `${days} 日样本仍在积累`;
  const summary = enoughEvidence
    ? `本期基于 ${evidence.length} 条可追溯证据形成 ${supportedFindings.length} 项观察，重点关注平台有效动作、内容需求与语种变化。`
    : '当前可验证信号不足以形成稳定趋势判断，页面保留现有证据并继续监测。';

  return {
    period: {
      range,
      days,
      current: { start: currentStart, end: periodEnd },
      previous: { start: previousStart, end: currentStart },
    },
    summary: {
      headline,
      text: summary,
      generationMethod: 'rules' as const,
      generatedAt: periodEnd,
      sufficientEvidence: enoughEvidence,
    },
    findings: supportedFindings.slice(0, 5),
    signals: {
      categories: categorySignals,
      languages: languageSignals,
      keywords: keywordSignals,
      platforms: platformRows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        change: makeChange(Number(row.current_count), Number(row.previous_count)),
        categoryCount: Number(row.category_count),
        latestUpdate: String(row.latest_update || ''),
      })),
    },
    evidence,
    coverage,
  };
}

export function saveTrendDigest(
  range: TrendRange,
  language: string,
  analysis: ReturnType<typeof buildTrendAnalysis>,
  options: { headline?: string; summary?: string; findings?: TrendFinding[]; generationMethod: 'rules' | 'ai'; model?: string },
) {
  initDb();
  const evidenceIds = analysis.evidence.map((item) => item.id);
  getDb().prepare(`
    INSERT INTO trend_digests (
      id, digest_date, range_key, language, headline, summary, findings, signals,
      evidence_ids, generation_method, model, status, generated_at
    ) VALUES (?, date('now', 'localtime'), ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', CURRENT_TIMESTAMP)
    ON CONFLICT(digest_date, range_key, language) DO UPDATE SET
      headline=excluded.headline, summary=excluded.summary, findings=excluded.findings,
      signals=excluded.signals, evidence_ids=excluded.evidence_ids,
      generation_method=excluded.generation_method, model=excluded.model,
      status='published', generated_at=CURRENT_TIMESTAMP
  `).run(
    randomUUID(), range, language,
    options.headline || analysis.summary.headline,
    options.summary || analysis.summary.text,
    JSON.stringify(options.findings || analysis.findings),
    JSON.stringify(analysis.signals),
    JSON.stringify(evidenceIds),
    options.generationMethod,
    options.model || null,
  );
}

export function getLatestTrendDigest(
  range: TrendRange,
  language: string,
): (Record<string, unknown> & { findings: unknown[]; signals: Record<string, unknown>; evidence_ids: unknown[] }) | null {
  initDb();
  const row = getDb().prepare(`
    SELECT * FROM trend_digests
    WHERE range_key=? AND language=? AND status='published'
    ORDER BY digest_date DESC, generated_at DESC LIMIT 1
  `).get(range, language) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    ...row,
    findings: parseJson(row.findings, []),
    signals: parseJson<Record<string, unknown>>(row.signals, {}),
    evidence_ids: parseJson(row.evidence_ids, []),
  };
}
