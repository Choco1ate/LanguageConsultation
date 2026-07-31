import { createHash, randomUUID } from 'crypto';
import { getDb, initDb } from './db';
import { buildTrendAnalysis, normalizeTrendLanguage, saveTrendDigest, type TrendEvidence, type TrendFinding, type TrendRange } from './trend-analysis';

export const ARTICLE_CATEGORIES = ['政策与考试', '产品与课程', '市场与公司', '留学趋势', '学习方法', '文化热点'] as const;
export const UPDATE_CATEGORIES_EDITORIAL = ['新功能', '价格与订阅', '课程内容', '渠道合作', '营销活动', '公司新闻', '版本维护'] as const;
export type EditorialEntityType = 'article' | 'competitor_update';

export interface Editorial {
  summary: string;
  whyItMatters: string;
  audience: string;
  keyPoints: string[];
  category: string;
  confidence: number;
  sourceUrls: string[];
  generatedAt: string;
  model: string;
  aiAssisted: true;
}

type SourceRecord = {
  id: string;
  title: string;
  body: string | null;
  source_url: string | null;
  source_name: string | null;
  published_at: string | null;
  entity_type: EditorialEntityType;
};

const PROMPT_VERSION = 'editorial-v1';
const CONTENT_MODEL = process.env.OPENAI_CONTENT_MODEL || 'gpt-5.6-luna';
const REPORT_MODEL = process.env.OPENAI_REPORT_MODEL || 'gpt-5.6-terra';

function hashRecord(record: SourceRecord) {
  return createHash('sha256').update([
    record.title, record.body || '', record.source_url || '', record.published_at || '',
  ].join('\n')).digest('hex');
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  try { return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}

export function mapEditorialRow(row: Record<string, unknown> | undefined): Editorial | null {
  if (!row || row.editorial_status !== 'published' || !row.editorial_summary) return null;
  return {
    summary: String(row.editorial_summary),
    whyItMatters: String(row.why_it_matters || ''),
    audience: String(row.editorial_audience || ''),
    keyPoints: parseJson(String(row.key_points || '[]'), []),
    category: String(row.editorial_category || ''),
    confidence: Number(row.editorial_confidence || 0),
    sourceUrls: parseJson(String(row.editorial_source_urls || '[]'), []),
    generatedAt: String(row.editorial_generated_at || ''),
    model: String(row.editorial_model || ''),
    aiAssisted: true,
  };
}

export const EDITORIAL_SELECT = `
  ce.editorial_summary,
  ce.why_it_matters,
  ce.audience AS editorial_audience,
  ce.key_points,
  ce.category AS editorial_category,
  ce.confidence AS editorial_confidence,
  ce.source_urls AS editorial_source_urls,
  ce.status AS editorial_status,
  ce.generated_at AS editorial_generated_at,
  ce.model AS editorial_model
`;

export function attachEditorial<T extends Record<string, unknown>>(row: T) {
  return { ...row, editorial: mapEditorialRow(row) };
}

function extractNumbers(text: string) {
  return [...text.matchAll(/\d+(?:[.,]\d+)?%?/g)].map((match) => match[0]);
}

function validateEnhancement(data: Record<string, unknown>, source: SourceRecord) {
  const summary = typeof data.summary === 'string' ? data.summary.trim() : '';
  const why = typeof data.whyItMatters === 'string' ? data.whyItMatters.trim() : '';
  const keyPoints = Array.isArray(data.keyPoints) ? data.keyPoints.filter((item): item is string => typeof item === 'string').slice(0, 3) : [];
  const category = typeof data.category === 'string' ? data.category : '';
  const confidence = Number(data.confidence);
  const allowed = source.entity_type === 'article' ? ARTICLE_CATEGORIES : UPDATE_CATEGORIES_EDITORIAL;
  const sourceText = `${source.title} ${source.body || ''}`;
  const unsupportedNumber = extractNumbers(`${summary} ${why} ${keyPoints.join(' ')}`)
    .some((number) => !sourceText.includes(number));
  const valid = Boolean(source.source_url)
    && summary.length >= 28 && summary.length <= 220
    && why.length >= 16 && why.length <= 180
    && keyPoints.length === 3
    && allowed.includes(category as never)
    && Number.isFinite(confidence) && confidence >= 0.75
    && !unsupportedNumber;
  return {
    summary, whyItMatters: why, keyPoints, category,
    audience: typeof data.audience === 'string' ? data.audience.trim().slice(0, 80) : '小语种教育行业从业者',
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0,
    status: valid ? 'published' : 'review_needed',
  };
}

async function callStructuredModel(model: string, instructions: string, input: string, schemaName: string, schema: Record<string, unknown>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      reasoning: { effort: 'low' },
      instructions,
      input,
      text: { format: { type: 'json_schema', name: schemaName, strict: true, schema } },
    }),
  });
  if (!response.ok) throw new Error(`OpenAI Responses API ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const payload = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const text = payload.output_text || payload.output?.flatMap((item) => item.content || []).map((item) => item.text || '').join('') || '';
  if (!text) throw new Error('OpenAI response did not contain structured text');
  return JSON.parse(text) as Record<string, unknown>;
}

const ENRICHMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'whyItMatters', 'audience', 'keyPoints', 'category', 'confidence'],
  properties: {
    summary: { type: 'string' },
    whyItMatters: { type: 'string' },
    audience: { type: 'string' },
    keyPoints: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string' } },
    category: { type: 'string' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
};

function getCandidates(limit: number, backfill: boolean): SourceRecord[] {
  const db = getDb();
  const dateClause = backfill ? "datetime(COALESCE(published_at, created_at)) >= datetime('now', '-30 days')" : "datetime(created_at) >= datetime('now', '-2 days')";
  const articles = db.prepare(`
    SELECT id, title, COALESCE(content, summary) AS body, source_url, source_name, published_at, 'article' AS entity_type
    FROM articles WHERE ${dateClause} AND COALESCE(language, '') != 'chinese'
    ORDER BY score DESC, datetime(COALESCE(published_at, created_at)) DESC LIMIT ?
  `).all(limit) as SourceRecord[];
  const updates = db.prepare(`
    SELECT id, title, content AS body, source_url, source_channel AS source_name, published_at, 'competitor_update' AS entity_type
    FROM competitor_updates WHERE ${dateClause}
    ORDER BY importance DESC, datetime(COALESCE(published_at, created_at)) DESC LIMIT ?
  `).all(limit) as SourceRecord[];
  return [...articles, ...updates].sort((a, b) => String(b.published_at || '').localeCompare(String(a.published_at || ''))).slice(0, limit);
}

export async function enrichContent({ limit = 30, backfill = false } = {}) {
  initDb();
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO content_enrichments (
      id, entity_type, entity_id, content_hash, editorial_summary, why_it_matters,
      audience, key_points, category, confidence, status, source_urls, model, prompt_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  let processed = 0; let published = 0; let skipped = 0; const errors: string[] = [];
  for (const source of getCandidates(Math.min(limit, 60), backfill)) {
    const hash = hashRecord(source);
    const exists = db.prepare('SELECT 1 FROM content_enrichments WHERE entity_type = ? AND entity_id = ? AND content_hash = ?').get(source.entity_type, source.id, hash);
    if (exists) { skipped++; continue; }
    try {
      const categories = source.entity_type === 'article' ? ARTICLE_CATEGORIES : UPDATE_CATEGORIES_EDITORIAL;
      const raw = await callStructuredModel(
        CONTENT_MODEL,
        `你是小语种教育行业编辑。只根据输入来源整理，不补充外部事实。分类必须从以下选项选择：${categories.join('、')}。摘要说明发生了什么；影响判断说明为何值得行业人员关注；给出恰好3条要点。若来源信息有限，降低confidence。`,
        JSON.stringify(source),
        'content_enrichment',
        { ...ENRICHMENT_SCHEMA, properties: { ...ENRICHMENT_SCHEMA.properties, category: { type: 'string', enum: categories } } },
      );
      const value = validateEnhancement(raw, source);
      insert.run(randomUUID(), source.entity_type, source.id, hash, value.summary, value.whyItMatters,
        value.audience, JSON.stringify(value.keyPoints), value.category, value.confidence, value.status,
        JSON.stringify([source.source_url]), CONTENT_MODEL, PROMPT_VERSION);
      processed++; if (value.status === 'published') published++;
    } catch (error) { errors.push(`${source.entity_type}:${source.id}:${error instanceof Error ? error.message : String(error)}`); }
  }
  return { processed, published, reviewNeeded: processed - published, skipped, errors: errors.slice(0, 10), model: CONTENT_MODEL };
}

export async function generateDailyBrief(date = new Date().toISOString().slice(0, 10)) {
  initDb(); const db = getDb();
  const rows = db.prepare(`
    SELECT ce.entity_type, ce.entity_id, ce.editorial_summary, ce.why_it_matters, ce.category,
      CASE WHEN ce.entity_type = 'competitor_update' THEN c.name ELSE a.source_name END AS source_name
    FROM content_enrichments ce
    LEFT JOIN articles a ON ce.entity_type = 'article' AND a.id = ce.entity_id
    LEFT JOIN competitor_updates cu ON ce.entity_type = 'competitor_update' AND cu.id = ce.entity_id
    LEFT JOIN competitors c ON c.id = cu.competitor_id
    WHERE ce.status = 'published' AND date(ce.generated_at) = ?
      AND (ce.entity_type != 'article' OR COALESCE(a.language, '') != 'chinese')
    ORDER BY ce.confidence DESC LIMIT 12
  `).all(date) as Record<string, unknown>[];
  if (!rows.length) return { generated: false, reason: 'no_published_enrichments' };
  const schema = { type: 'object', additionalProperties: false, required: ['headline', 'summary', 'signals'], properties: {
    headline: { type: 'string' }, summary: { type: 'string' },
    signals: { type: 'array', minItems: 3, maxItems: 5, items: { type: 'object', additionalProperties: false, required: ['title', 'insight', 'entityId', 'entityType'], properties: {
      title: { type: 'string' }, insight: { type: 'string' }, entityId: { type: 'string' }, entityType: { type: 'string', enum: ['article', 'competitor_update'] },
    } } },
  } };
  const raw = await callStructuredModel(CONTENT_MODEL, '仅基于输入的已验证情报生成中文每日简报。不得增加数字或事实。选择3到5个最重要信号。', JSON.stringify(rows), 'daily_brief', schema);
  const signals = Array.isArray(raw.signals) ? raw.signals : [];
  const ids = signals.map((item) => (item as Record<string, unknown>).entityId).filter(Boolean);
  const sources = new Set(rows.map((row) => String(row.source_name || '')).filter(Boolean));
  const platforms = new Set(rows.filter((row) => row.entity_type === 'competitor_update').map((row) => String(row.source_name || '')).filter(Boolean));
  db.prepare(`INSERT INTO daily_briefs (brief_date, headline, summary, signals, source_ids, platform_count, source_count, model, status, generated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', CURRENT_TIMESTAMP)
    ON CONFLICT(brief_date) DO UPDATE SET headline=excluded.headline, summary=excluded.summary, signals=excluded.signals, source_ids=excluded.source_ids,
    platform_count=excluded.platform_count, source_count=excluded.source_count, model=excluded.model, generated_at=CURRENT_TIMESTAMP`
  ).run(date, String(raw.headline || ''), String(raw.summary || ''), JSON.stringify(signals), JSON.stringify(ids), platforms.size, sources.size, CONTENT_MODEL);
  return { generated: true, date, signalCount: signals.length };
}

export type WeeklySectionType = 'platform_action' | 'market_change' | 'demand_theme' | 'data_note';
export type WeeklySection = {
  heading: string;
  analysis: string;
  evidenceIds: string[];
  type: WeeklySectionType;
};

function currentWeekStart() {
  const now = new Date();
  const shanghai = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  shanghai.setDate(shanghai.getDate() - ((shanghai.getDay() + 6) % 7));
  const year = shanghai.getFullYear();
  const month = String(shanghai.getMonth() + 1).padStart(2, '0');
  const day = String(shanghai.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sectionType(finding: TrendFinding): WeeklySectionType {
  if (finding.id.startsWith('platform')) return 'platform_action';
  if (finding.id.startsWith('topic') || finding.id.startsWith('language') || finding.id === 'content-demand') return 'demand_theme';
  return 'market_change';
}

export function buildRuleWeeklyReport() {
  const trend = buildTrendAnalysis('7d', 'all');
  const sections: WeeklySection[] = trend.findings.slice(0, 3).map((finding) => ({
    heading: finding.title,
    analysis: `${finding.insight}${finding.impact}`,
    evidenceIds: finding.evidenceIds,
    type: sectionType(finding),
  }));
  if (!sections.length) {
    sections.push({
      heading: '本周有效样本仍在积累',
      analysis: '当前公开来源不足以支持稳定判断。系统将继续跟踪平台官网、课程目录、价格页面和应用商店更新。',
      evidenceIds: [],
      type: 'data_note',
    });
  }
  const watchPoints = [
    ...(trend.coverage.failedSources ? ['修复失败来源并确认官网信息是否恢复更新'] : []),
    ...(trend.coverage.activePlatforms < 3 ? ['关注 Top 10 平台是否出现新的功能、课程或合作动作'] : []),
    '继续监测价格与订阅页面是否发生实质变化',
    '结合考试节点观察语种内容关注度是否延续',
  ].slice(0, 4);
  const sourceIds = [...new Set(trend.evidence.map((item) => item.id))];
  const sourceCount = new Set(trend.evidence.map((item) => item.sourceName)).size;
  const metrics = {
    effectiveUpdates: trend.signals.categories.reduce((sum, item) => sum + item.change.current, 0),
    activePlatforms: trend.coverage.activePlatforms,
    articleSamples: trend.signals.languages.reduce((sum, item) => sum + item.change.current, 0),
    leadingLanguage: trend.signals.languages[0]?.label || '样本不足',
    sourceSuccessRate: trend.coverage.successRate,
    coverageGaps: trend.coverage.gaps,
    period: trend.period.current,
  };
  return {
    id: 'virtual-current-week',
    week_start: currentWeekStart(),
    title: trend.summary.sufficientEvidence
      ? `本周观察｜${trend.findings[0]?.title || '公开信号持续更新'}`
      : '本周观察｜有效样本仍在积累',
    thesis: trend.summary.text,
    sections,
    watch_points: watchPoints,
    source_ids: sourceIds,
    model: 'rules-v1',
    generation_method: 'rules',
    evidence_count: sourceIds.length,
    source_count: sourceCount,
    platform_count: trend.coverage.activePlatforms,
    metrics,
    status: 'published',
    published_at: new Date().toISOString(),
    is_virtual: true,
    evidence: trend.evidence,
  };
}

function saveWeeklyReport(report: ReturnType<typeof buildRuleWeeklyReport>) {
  initDb();
  getDb().prepare(`
    INSERT INTO weekly_reports (
      id, week_start, title, thesis, sections, watch_points, source_ids, model,
      generation_method, evidence_count, source_count, platform_count, metrics,
      status, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', CURRENT_TIMESTAMP)
    ON CONFLICT(week_start) DO UPDATE SET
      title=excluded.title, thesis=excluded.thesis, sections=excluded.sections,
      watch_points=excluded.watch_points, source_ids=excluded.source_ids,
      model=excluded.model, generation_method=excluded.generation_method,
      evidence_count=excluded.evidence_count, source_count=excluded.source_count,
      platform_count=excluded.platform_count, metrics=excluded.metrics,
      status='published', published_at=CURRENT_TIMESTAMP
  `).run(
    randomUUID(), report.week_start, report.title, report.thesis,
    JSON.stringify(report.sections), JSON.stringify(report.watch_points),
    JSON.stringify(report.source_ids), report.model, report.generation_method,
    report.evidence_count, report.source_count, report.platform_count,
    JSON.stringify(report.metrics),
  );
}

export async function generateWeeklyReport() {
  const fallback = buildRuleWeeklyReport();
  if (!process.env.OPENAI_API_KEY || fallback.evidence_count < 3) {
    saveWeeklyReport(fallback);
    return { generated: true, weekStart: fallback.week_start, method: 'rules', evidenceCount: fallback.evidence_count };
  }
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'thesis', 'sections', 'watchPoints'],
    properties: {
      title: { type: 'string' },
      thesis: { type: 'string' },
      sections: {
        type: 'array',
        minItems: 2,
        maxItems: 4,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['heading', 'analysis', 'evidenceIds', 'type'],
          properties: {
            heading: { type: 'string' },
            analysis: { type: 'string' },
            evidenceIds: { type: 'array', minItems: 1, items: { type: 'string' } },
            type: { type: 'string', enum: ['platform_action', 'market_change', 'demand_theme', 'data_note'] },
          },
        },
      },
      watchPoints: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string' } },
    },
  };
  try {
    const raw = await callStructuredModel(
      REPORT_MODEL,
      '仅依据输入证据撰写小语种教育行业周报。围绕一个核心判断组织2到4个分析章节，不补充外部事实或预测。所有数字必须存在于输入中，每个章节必须引用有效evidence id；样本不足时明确说明。',
      JSON.stringify(fallback),
      'weekly_report',
      schema,
    );
    const validIds = new Set(fallback.source_ids);
    const sections = (Array.isArray(raw.sections) ? raw.sections : []).map((item) => {
      const value = item as Record<string, unknown>;
      const evidenceIds = Array.isArray(value.evidenceIds)
        ? value.evidenceIds.map(String).filter((id) => validIds.has(id))
        : [];
      return {
        heading: String(value.heading || '').slice(0, 90),
        analysis: String(value.analysis || '').slice(0, 900),
        evidenceIds,
        type: String(value.type || 'data_note') as WeeklySectionType,
      };
    }).filter((section) => section.heading && section.analysis && section.evidenceIds.length);
    const combinedText = `${raw.title || ''} ${raw.thesis || ''} ${sections.map((section) => section.analysis).join(' ')}`;
    const sourceText = JSON.stringify(fallback);
    const unsupportedNumber = extractNumbers(combinedText).some((number) => !sourceText.includes(number));
    if (sections.length < 2 || unsupportedNumber) throw new Error('Weekly report contains unsupported claims');
    const report = {
      ...fallback,
      title: String(raw.title || fallback.title).slice(0, 120),
      thesis: String(raw.thesis || fallback.thesis).slice(0, 500),
      sections,
      watch_points: Array.isArray(raw.watchPoints) ? raw.watchPoints.map(String).slice(0, 4) : fallback.watch_points,
      model: REPORT_MODEL,
      generation_method: 'ai',
      is_virtual: false,
    };
    saveWeeklyReport(report);
    return { generated: true, weekStart: report.week_start, method: 'ai', evidenceCount: report.evidence_count };
  } catch (error) {
    saveWeeklyReport(fallback);
    return {
      generated: true,
      weekStart: fallback.week_start,
      method: 'rules',
      evidenceCount: fallback.evidence_count,
      warning: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function generateTrendDigest(range: TrendRange, requestedLanguage = 'all') {
  const language = normalizeTrendLanguage(requestedLanguage);
  const analysis = buildTrendAnalysis(range, language);
  if (!process.env.OPENAI_API_KEY || analysis.evidence.length < 3) {
    saveTrendDigest(range, language, analysis, { generationMethod: 'rules' });
    return { generated: true, range, language, method: 'rules', findingCount: analysis.findings.length };
  }

  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['headline', 'summary', 'findings'],
    properties: {
      headline: { type: 'string' },
      summary: { type: 'string' },
      findings: {
        type: 'array',
        minItems: 3,
        maxItems: 5,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'title', 'insight', 'impact', 'subject', 'evidenceIds'],
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            insight: { type: 'string' },
            impact: { type: 'string' },
            subject: { type: 'string' },
            evidenceIds: { type: 'array', minItems: 1, items: { type: 'string' } },
          },
        },
      },
    },
  };

  try {
    const raw = await callStructuredModel(
      REPORT_MODEL,
      '你是小语种教育行业研究编辑。仅根据输入的统计结果和证据形成3到5条结论。不得增加平台、数字、日期或事实；每条结论必须引用输入中存在的 evidence id。样本不足时必须明确说明，不得使用“暴涨”“领先市场”等夸大词。',
      JSON.stringify(analysis),
      'trend_digest',
      schema,
    );
    const validEvidenceIds = new Set(analysis.evidence.map((item) => item.id));
    const findings = (Array.isArray(raw.findings) ? raw.findings : [])
      .map((item, index) => {
        const value = item as Record<string, unknown>;
        const evidenceIds = Array.isArray(value.evidenceIds)
          ? value.evidenceIds.map(String).filter((id) => validEvidenceIds.has(id))
          : [];
        const baseline = analysis.findings.find((finding) => finding.id === value.id)
          || analysis.findings[index];
        if (!baseline || !evidenceIds.length) return null;
        return {
          ...baseline,
          id: String(value.id || baseline.id),
          title: String(value.title || baseline.title).slice(0, 80),
          insight: String(value.insight || baseline.insight).slice(0, 220),
          impact: String(value.impact || baseline.impact).slice(0, 180),
          subject: String(value.subject || baseline.subject).slice(0, 80),
          evidenceIds,
          evidenceCount: evidenceIds.length,
        } satisfies TrendFinding;
      })
      .filter((item): item is TrendFinding => Boolean(item));
    if (findings.length < 3) throw new Error('AI trend digest did not provide enough supported findings');
    saveTrendDigest(range, language, analysis, {
      headline: String(raw.headline || analysis.summary.headline).slice(0, 100),
      summary: String(raw.summary || analysis.summary.text).slice(0, 320),
      findings,
      generationMethod: 'ai',
      model: REPORT_MODEL,
    });
    return { generated: true, range, language, method: 'ai', findingCount: findings.length };
  } catch (error) {
    saveTrendDigest(range, language, analysis, { generationMethod: 'rules' });
    return {
      generated: true,
      range,
      language,
      method: 'rules',
      findingCount: analysis.findings.length,
      warning: error instanceof Error ? error.message : String(error),
    };
  }
}

export function getLatestBrief(): (Record<string, unknown> & { signals: unknown[]; source_ids: unknown[] }) | null {
  initDb();
  const row = getDb().prepare("SELECT * FROM daily_briefs WHERE status='published' ORDER BY brief_date DESC LIMIT 1").get() as Record<string, unknown> | undefined;
  return row ? { ...row, signals: parseJson<unknown[]>(String(row.signals || '[]'), []), source_ids: parseJson<unknown[]>(String(row.source_ids || '[]'), []) } : null;
}

type WeeklyReportRecord = Record<string, unknown> & {
  sections: WeeklySection[];
  watch_points: string[];
  source_ids: string[];
  metrics: Record<string, unknown>;
  evidence: TrendEvidence[];
};

function resolveWeeklyEvidence(sourceIds: string[]): TrendEvidence[] {
  if (!sourceIds.length) return [];
  const db = getDb();
  const placeholders = sourceIds.map(() => '?').join(',');
  const articles = db.prepare(`
    SELECT id, title, source_name, source_url, category, published_at, created_at
    FROM articles WHERE id IN (${placeholders}) AND COALESCE(language, '') != 'chinese'
  `).all(...sourceIds) as Array<Record<string, unknown>>;
  const updates = db.prepare(`
    SELECT cu.id, cu.title, cu.source_channel, cu.source_url, cu.category,
      cu.published_at, cu.created_at, c.id AS competitor_id, c.name AS competitor_name
    FROM competitor_updates cu JOIN competitors c ON c.id=cu.competitor_id
    WHERE cu.id IN (${placeholders}) AND cu.category != 'version_maintenance'
  `).all(...sourceIds) as Array<Record<string, unknown>>;
  const byId = new Map<string, TrendEvidence>();
  articles.forEach((row) => byId.set(String(row.id), {
    id: String(row.id),
    entityType: 'article',
    title: String(row.title),
    sourceName: String(row.source_name || '公开来源'),
    sourceUrl: String(row.source_url || ''),
    internalUrl: `/articles/${row.id}`,
    category: String(row.category || '行业文章'),
    publishedAt: String(row.published_at || row.created_at || ''),
  }));
  updates.forEach((row) => byId.set(String(row.id), {
    id: String(row.id),
    entityType: 'competitor_update',
    title: String(row.title),
    sourceName: String(row.source_channel || row.competitor_name || '官方来源'),
    sourceUrl: String(row.source_url || ''),
    internalUrl: `/competitors/${row.competitor_id}`,
    category: String(row.category || '产品动态'),
    publishedAt: String(row.published_at || row.created_at || ''),
  }));
  return sourceIds.map((id) => byId.get(id)).filter((item): item is TrendEvidence => Boolean(item));
}

function parseWeeklyReport(row: Record<string, unknown>): WeeklyReportRecord {
  const sections = parseJson<Array<WeeklySection & { sourceIds?: string[] }>>(String(row.sections || '[]'), [])
    .map((section) => ({
      heading: section.heading,
      analysis: section.analysis,
      evidenceIds: section.evidenceIds || section.sourceIds || [],
      type: section.type || 'data_note',
    }));
  const sourceIds = parseJson<string[]>(String(row.source_ids || '[]'), []);
  return {
    ...row,
    sections,
    watch_points: parseJson<string[]>(String(row.watch_points || '[]'), []),
    source_ids: sourceIds,
    metrics: parseJson<Record<string, unknown>>(String(row.metrics || '{}'), {}),
    evidence: resolveWeeklyEvidence(sourceIds),
  };
}

export function listWeeklyReports(limit = 12) {
  initDb();
  return getDb().prepare(`
    SELECT week_start, title, thesis, generation_method, evidence_count, published_at
    FROM weekly_reports WHERE status='published'
    ORDER BY week_start DESC LIMIT ?
  `).all(Math.max(1, Math.min(limit, 52))) as Array<Record<string, unknown>>;
}

export function getWeeklyReport(requestedWeek?: string | null): WeeklyReportRecord {
  initDb();
  const db = getDb();
  let row: Record<string, unknown> | undefined;
  if (requestedWeek && /^\d{4}-\d{2}-\d{2}$/.test(requestedWeek)) {
    row = db.prepare("SELECT * FROM weekly_reports WHERE status='published' AND week_start=? LIMIT 1")
      .get(requestedWeek) as Record<string, unknown> | undefined;
  }
  row ||= db.prepare("SELECT * FROM weekly_reports WHERE status='published' ORDER BY week_start DESC LIMIT 1")
    .get() as Record<string, unknown> | undefined;
  if (row) return parseWeeklyReport(row);
  return buildRuleWeeklyReport() as WeeklyReportRecord;
}

export function getLatestWeeklyReport(): WeeklyReportRecord {
  return getWeeklyReport();
}
