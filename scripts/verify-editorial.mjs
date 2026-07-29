import assert from 'node:assert/strict';
import Database from 'better-sqlite3';

const db = new Database('data/app.db', { readonly: true });
const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row) => row.name));
for (const table of ['content_enrichments', 'daily_briefs', 'weekly_reports']) {
  assert(tables.has(table), `Missing table: ${table}`);
}

const allowedArticleCategories = new Set(['政策与考试', '产品与课程', '市场与公司', '留学趋势', '学习方法', '文化热点']);
const articleCategories = db.prepare('SELECT DISTINCT category FROM articles').all();
for (const row of articleCategories) assert(allowedArticleCategories.has(row.category), `Unexpected article category: ${row.category}`);

const allowedUpdateCategories = new Set(['new_feature', 'price_subscription', 'course_content', 'partnership', 'marketing', 'company_news', 'version_maintenance']);
const updateCategories = db.prepare('SELECT DISTINCT category FROM competitor_updates').all();
for (const row of updateCategories) assert(allowedUpdateCategories.has(row.category), `Unexpected update category: ${row.category}`);

const invalidPublished = db.prepare(`
  SELECT COUNT(*) AS count FROM content_enrichments
  WHERE status='published' AND (
    editorial_summary='' OR why_it_matters='' OR json_array_length(key_points) != 3
    OR json_array_length(source_urls) < 1 OR confidence < 0.75
  )
`).get();
assert.equal(invalidPublished.count, 0, 'Published enrichment failed validation');

console.log(JSON.stringify({
  ok: true,
  articleCategories: articleCategories.length,
  updateCategories: updateCategories.length,
  enrichments: db.prepare('SELECT COUNT(*) AS count FROM content_enrichments').get().count,
}, null, 2));
