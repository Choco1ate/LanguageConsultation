import { getDb, initDb } from './db';
import { scrapeArticleSource } from './scraper/article-scraper';
import { competitorConfigs, scrapeCompetitor } from './scraper/competitor-scraper';
import { scrapeAppStoreUpdates, type StoreUpdate } from './scraper/appstore-scraper';
import { scrapeAndroidStoreUpdates } from './scraper/android-store-scraper';
import sourcesData from '@/data/sources.json';
import { v4 as uuidv4 } from 'uuid';
import { calculateImportance, classifyUpdate } from './content-intelligence';

function recordRun(
  sourceType: 'article' | 'competitor' | 'app_store' | 'android_store',
  sourceName: string,
  status: 'success' | 'error',
  fetchedCount: number,
  startedAt: string,
  error?: unknown
) {
  getDb().prepare(`
    INSERT INTO scraper_runs (
      id, source_type, source_name, status, fetched_count,
      error_message, started_at, finished_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(), sourceType, sourceName, status, fetchedCount,
    error instanceof Error ? error.message.slice(0, 500) : error ? String(error).slice(0, 500) : null,
    startedAt, new Date().toISOString()
  );
}

export async function fetchArticles(): Promise<number> {
  initDb();
  const db = getDb();

  const checkExists = db.prepare('SELECT id FROM articles WHERE source_url = ? LIMIT 1');
  const updateArticle = db.prepare(`
    UPDATE articles
    SET title = ?, summary = ?, content = ?, source_name = ?, language = ?,
        tags = ?, score = ?, category = ?, importance = ?, published_at = ?
    WHERE id = ?
  `);
  const insertArticle = db.prepare(`
    INSERT INTO articles (
      id, title, summary, content, source_url, source_name, language,
      tags, score, category, importance, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let totalNew = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = sourcesData as any;
  const allSources = [...data.exam_sources, ...data.news_sources];

  for (const source of allSources) {
    const startedAt = new Date().toISOString();
    try {
      // 来源配置是语种和标签的权威定义，同步修复不再出现在首页的旧文章。
      db.prepare('UPDATE articles SET language = ?, tags = ? WHERE source_name = ?').run(
        source.language,
        JSON.stringify(source.tags),
        source.name
      );

      const articles = await scrapeArticleSource(source);
      let sourceNew = 0;

      for (const article of articles) {
        const category = article.tags?.[0] || '其他';
        const importance = Math.max(1, Math.min(5, Math.round((article.score || 0) / 2) || 1));
        // 已抓取过的文章也要同步来源配置，避免旧语种或标签永久残留。
        const existing = checkExists.get(article.source_url) as { id: string } | undefined;
        if (existing) {
          updateArticle.run(
            article.title,
            article.summary,
            article.content,
            article.source_name,
            article.language,
            JSON.stringify(article.tags),
            article.score || 0,
            category,
            importance,
            article.published_at,
            existing.id
          );
          continue;
        }

        const id = uuidv4();
        insertArticle.run(
          id,
          article.title,
          article.summary,
          article.content,
          article.source_url,
          article.source_name,
          article.language,
          JSON.stringify(article.tags),
          article.score || 0,
          category,
          importance,
          article.published_at
        );
        totalNew++;
        sourceNew++;
      }
      recordRun('article', source.name, 'success', sourceNew, startedAt);
    } catch (error) {
      console.error(`[文章来源抓取失败] ${source.name}:`, error);
      recordRun('article', source.name, 'error', 0, startedAt, error);
    }
  }

  return totalNew;
}

export async function fetchCompetitorUpdates(): Promise<number> {
  initDb();
  const db = getDb();

  const checkExists = db.prepare('SELECT id FROM competitor_updates WHERE source_url = ? AND competitor_id = ? LIMIT 1');
  const productRows = db.prepare(
    'SELECT id, competitor_id, name, aliases FROM competitor_products WHERE status = ?'
  ).all('active') as Array<{ id: string; competitor_id: string; name: string; aliases: string }>;
  const resolveProductId = (competitorId: string, productName: string) => {
    const normalized = productName.trim().toLocaleLowerCase();
    return productRows.find((item) => {
      const aliases = JSON.parse(item.aliases || '[]') as string[];
      return item.competitor_id === competitorId
        && [item.name, ...aliases].some((name) => name.toLocaleLowerCase() === normalized);
    })?.id || null;
  };
  const insertUpdate = db.prepare(`
    INSERT INTO competitor_updates (
      id, competitor_id, product_id, product_name, title, content, update_type, category,
      importance, source_channel, source_url, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateExisting = db.prepare(`
    UPDATE competitor_updates
    SET product_id = ?, product_name = ?, title = ?, content = ?, update_type = ?, category = ?, importance = ?,
        source_channel = ?, source_url = ?, published_at = ?
    WHERE id = ?
  `);
  const updateStoreProduct = db.prepare(`
    UPDATE competitor_products
    SET icon_url = COALESCE(?, icon_url),
        store_description = COALESCE(?, store_description),
        app_store_url = CASE WHEN ? = 'apple' THEN ? ELSE app_store_url END,
        android_url = CASE WHEN ? = 'android' THEN ? ELSE android_url END,
        last_verified_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const upsertMedia = db.prepare(`
    INSERT INTO product_media (
      id, product_id, media_type, original_url, source_url, alt_text,
      sort_order, captured_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(product_id, media_type, sort_order) DO UPDATE SET
      original_url = excluded.original_url,
      source_url = excluded.source_url,
      alt_text = excluded.alt_text,
      captured_at = CURRENT_TIMESTAMP
  `);
  const syncStoreProduct = (update: StoreUpdate) => {
    const productId = resolveProductId(update.competitor_id, update.product_name);
    if (!productId) return null;
    updateStoreProduct.run(
      update.product_icon_url || null,
      update.product_description || null,
      update.store_type || null,
      update.source_url,
      update.store_type || null,
      update.source_url,
      productId
    );
    if (update.product_icon_url) {
      upsertMedia.run(
        `${productId}-cover`, productId, 'cover', update.product_icon_url,
        update.source_url, `${update.product_name} 产品图标`, 0
      );
    }
    (update.product_screenshot_urls || []).slice(0, 3).forEach((imageUrl, index) => {
      upsertMedia.run(
        `${productId}-screenshot-${index + 1}`, productId, 'screenshot', imageUrl,
        update.source_url, `${update.product_name} 官方截图 ${index + 1}`, index + 1
      );
    });
    return productId;
  };

  let totalNew = 0;

  // 1. 网站抓取
  for (const config of competitorConfigs) {
    const startedAt = new Date().toISOString();
    try {
      const updates = await scrapeCompetitor(config);
      let sourceNew = 0;

      for (const update of updates) {
        const category = classifyUpdate(update.title, update.content, update.update_type);
        const importance = calculateImportance(update.title, update.content, category);
        const productId = resolveProductId(update.competitor_id, update.product_name);
        const existing = checkExists.get(update.source_url, update.competitor_id) as { id: string } | undefined;
        if (existing) {
          updateExisting.run(
            productId, update.product_name, update.title, update.content, update.update_type, category, importance,
            update.source_channel, update.source_url, update.published_at, existing.id
          );
          continue;
        }

        const id = uuidv4();
        insertUpdate.run(
          id, update.competitor_id, productId, update.product_name, update.title, update.content, update.update_type,
          category, importance,
          update.source_channel, update.source_url, update.published_at
        );
        totalNew++;
        sourceNew++;
      }
      recordRun('competitor', config.id, 'success', sourceNew, startedAt);
    } catch (error) {
      console.error(`[竞品来源抓取失败] ${config.id}:`, error);
      recordRun('competitor', config.id, 'error', 0, startedAt, error);
    }
  }

  // 2. App Store 版本更新抓取
  try {
    const startedAt = new Date().toISOString();
    const appleResult = await scrapeAppStoreUpdates();
    const checkByTitle = db.prepare('SELECT id FROM competitor_updates WHERE competitor_id = ? AND title = ? LIMIT 1');
    for (const update of appleResult.updates) {
      const category = classifyUpdate(update.title, update.content, update.update_type);
      const importance = calculateImportance(update.title, update.content, category);
      const productId = syncStoreProduct(update);
      const existing = checkByTitle.get(update.competitor_id, update.title) as { id: string } | undefined;
      if (existing) {
        updateExisting.run(
          productId, update.product_name, update.title, update.content, update.update_type, category, importance,
          update.source_channel, update.source_url, update.published_at, existing.id
        );
        continue;
      }

      const id = uuidv4();
      insertUpdate.run(
        id, update.competitor_id, productId, update.product_name, update.title, update.content, update.update_type,
        category, importance,
        update.source_channel, update.source_url, update.published_at
      );
      totalNew++;
    }
    for (const result of appleResult.results) {
      recordRun('app_store', result.sourceName, result.status, result.fetchedCount, startedAt, result.error);
    }
  } catch (error) {
    console.error('[App Store 抓取失败]:', error);
    recordRun('app_store', 'Apple App Store', 'error', 0, new Date().toISOString(), error);
  }

  // 3. Android 渠道：Google Play + 小米应用商店
  try {
    const startedAt = new Date().toISOString();
    const androidResult = await scrapeAndroidStoreUpdates();
    const checkByTitle = db.prepare('SELECT id FROM competitor_updates WHERE competitor_id = ? AND title = ? LIMIT 1');

    for (const update of androidResult.updates) {
      const category = classifyUpdate(update.title, update.content, update.update_type);
      const importance = calculateImportance(update.title, update.content, category);
      const productId = syncStoreProduct(update);
      const existing = checkByTitle.get(update.competitor_id, update.title) as { id: string } | undefined;
      if (existing) {
        updateExisting.run(
          productId, update.product_name, update.title, update.content, update.update_type, category, importance,
          update.source_channel, update.source_url, update.published_at, existing.id
        );
        continue;
      }

      const id = uuidv4();
      insertUpdate.run(
        id, update.competitor_id, productId, update.product_name, update.title, update.content, update.update_type,
        category, importance,
        update.source_channel, update.source_url, update.published_at
      );
      totalNew++;
    }
    for (const result of androidResult.results) {
      recordRun('android_store', result.sourceName, result.status, result.fetchedCount, startedAt, result.error);
    }
  } catch (error) {
    console.error('[Android 应用商店抓取失败]:', error);
    recordRun('android_store', 'Android 应用商店', 'error', 0, new Date().toISOString(), error);
  }

  return totalNew;
}
