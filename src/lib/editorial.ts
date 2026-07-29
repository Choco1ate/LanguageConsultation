import { createHash, randomUUID } from 'crypto';
import { getDb, initDb } from './db';

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
    FROM articles WHERE ${dateClause}
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
    WHERE ce.status = 'published' AND date(ce.generated_at) = ? ORDER BY ce.confidence DESC LIMIT 12
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

export async function generateWeeklyReport() {
  initDb(); const db = getDb();
  const now = new Date(); const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekStart = monday.toISOString().slice(0, 10);
  const rows = db.prepare(`SELECT entity_type, entity_id, editorial_summary, why_it_matters, category
    FROM content_enrichments WHERE status='published' AND datetime(generated_at) >= datetime(?, '-7 days')
    ORDER BY confidence DESC LIMIT 40`).all(weekStart) as Record<string, unknown>[];
  if (!rows.length) return { generated: false, reason: 'no_published_enrichments' };
  const schema = { type: 'object', additionalProperties: false, required: ['title', 'thesis', 'sections', 'watchPoints'], properties: {
    title: { type: 'string' }, thesis: { type: 'string' },
    sections: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'object', additionalProperties: false, required: ['heading', 'analysis', 'sourceIds'], properties: {
      heading: { type: 'string' }, analysis: { type: 'string' }, sourceIds: { type: 'array', items: { type: 'string' } },
    } } },
    watchPoints: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string' } },
  } };
  const raw = await callStructuredModel(REPORT_MODEL, '仅基于输入情报形成小语种教育行业周报，说明共同趋势与后续观察点，不做无依据预测。每个分析段必须关联输入中的entity_id。', JSON.stringify(rows), 'weekly_report', schema);
  const sourceIds = [...new Set(rows.map((row) => String(row.entity_id)))];
  db.prepare(`INSERT INTO weekly_reports (id, week_start, title, thesis, sections, watch_points, source_ids, model, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published')
    ON CONFLICT(week_start) DO UPDATE SET title=excluded.title, thesis=excluded.thesis, sections=excluded.sections,
    watch_points=excluded.watch_points, source_ids=excluded.source_ids, model=excluded.model, published_at=CURRENT_TIMESTAMP`
  ).run(randomUUID(), weekStart, String(raw.title || ''), String(raw.thesis || ''), JSON.stringify(raw.sections || []), JSON.stringify(raw.watchPoints || []), JSON.stringify(sourceIds), REPORT_MODEL);
  return { generated: true, weekStart };
}

export function getLatestBrief(): (Record<string, unknown> & { signals: unknown[]; source_ids: unknown[] }) | null {
  initDb();
  const row = getDb().prepare("SELECT * FROM daily_briefs WHERE status='published' ORDER BY brief_date DESC LIMIT 1").get() as Record<string, unknown> | undefined;
  return row ? { ...row, signals: parseJson<unknown[]>(String(row.signals || '[]'), []), source_ids: parseJson<unknown[]>(String(row.source_ids || '[]'), []) } : null;
}

export function getLatestWeeklyReport(): (Record<string, unknown> & { sections: unknown[]; watch_points: unknown[] }) | null {
  initDb();
  const row = getDb().prepare("SELECT * FROM weekly_reports WHERE status='published' ORDER BY week_start DESC LIMIT 1").get() as Record<string, unknown> | undefined;
  return row ? { ...row, sections: parseJson<unknown[]>(String(row.sections || '[]'), []), watch_points: parseJson<unknown[]>(String(row.watch_points || '[]'), []) } : null;
}
