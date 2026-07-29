import Database from 'better-sqlite3';
import path from 'path';
import { competitorProfileSeeds, examSeeds } from '@/data/extended-content';
import competitorsData from '@/data/competitors.json';
import { productSeeds } from '@/data/product-catalog';
import { calculateImportance, classifyUpdate } from './content-intelligence';

const DB_PATH = path.join(process.cwd(), 'data', 'app.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb() {
  const database = getDb();
  
  database.exec(`
    CREATE TABLE IF NOT EXISTS competitors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      language TEXT NOT NULL,
      type TEXT NOT NULL,
      url TEXT,
      logo_url TEXT,
      description TEXT,
      market TEXT DEFAULT 'global',
      ranking INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS competitor_updates (
      id TEXT PRIMARY KEY,
      competitor_id TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT,
      title TEXT NOT NULL,
      content TEXT,
      update_type TEXT,
      source_channel TEXT,
      category TEXT DEFAULT 'other',
      importance INTEGER DEFAULT 1,
      source_url TEXT,
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (competitor_id) REFERENCES competitors(id)
    );

    CREATE TABLE IF NOT EXISTS competitor_products (
      id TEXT PRIMARY KEY,
      competitor_id TEXT NOT NULL,
      name TEXT NOT NULL,
      product_type TEXT NOT NULL,
      short_description TEXT NOT NULL,
      description TEXT NOT NULL,
      languages TEXT NOT NULL,
      platforms TEXT NOT NULL,
      target_audience TEXT,
      key_features TEXT NOT NULL,
      pricing_model TEXT,
      official_url TEXT NOT NULL,
      app_store_url TEXT,
      android_url TEXT,
      icon_url TEXT,
      store_description TEXT,
      source_name TEXT NOT NULL,
      source_url TEXT NOT NULL,
      aliases TEXT NOT NULL DEFAULT '[]',
      sort_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      last_verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (competitor_id) REFERENCES competitors(id),
      UNIQUE (competitor_id, name)
    );

    CREATE TABLE IF NOT EXISTS product_media (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      media_type TEXT NOT NULL,
      local_path TEXT,
      original_url TEXT,
      source_url TEXT NOT NULL,
      alt_text TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES competitor_products(id),
      UNIQUE (product_id, media_type, sort_order)
    );

    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT,
      content TEXT,
      source_url TEXT NOT NULL,
      source_name TEXT,
      language TEXT,
      tags TEXT,
      cover_image TEXT,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      score REAL DEFAULT 0,
      category TEXT DEFAULT '其他',
      importance INTEGER DEFAULT 1,
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exam_events (
      id TEXT PRIMARY KEY,
      exam_type TEXT NOT NULL,
      language TEXT NOT NULL,
      title TEXT NOT NULL,
      registration_start DATE,
      registration_end DATE,
      exam_date DATE,
      result_date DATE,
      source_url TEXT NOT NULL,
      source_name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS competitor_profiles (
      competitor_id TEXT PRIMARY KEY,
      supported_languages TEXT NOT NULL,
      platforms TEXT NOT NULL,
      learning_modes TEXT NOT NULL,
      target_audience TEXT,
      pricing_model TEXT,
      key_features TEXT NOT NULL,
      last_verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (competitor_id) REFERENCES competitors(id)
    );

    CREATE TABLE IF NOT EXISTS scraper_runs (
      id TEXT PRIMARY KEY,
      source_type TEXT NOT NULL,
      source_name TEXT NOT NULL,
      status TEXT NOT NULL,
      fetched_count INTEGER DEFAULT 0,
      error_message TEXT,
      started_at DATETIME NOT NULL,
      finished_at DATETIME NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_competitor_updates_competitor 
      ON competitor_updates(competitor_id);
    CREATE INDEX IF NOT EXISTS idx_competitor_products_competitor
      ON competitor_products(competitor_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_product_media_product
      ON product_media(product_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_articles_language 
      ON articles(language);
    CREATE INDEX IF NOT EXISTS idx_articles_published 
      ON articles(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_score 
      ON articles(score DESC);
    CREATE INDEX IF NOT EXISTS idx_exam_events_date
      ON exam_events(exam_date);
    CREATE INDEX IF NOT EXISTS idx_scraper_runs_source
      ON scraper_runs(source_type, source_name, finished_at DESC);
  `);

  // 迁移：为已有表添加新字段（如果不存在）
  try {
    database.exec(`ALTER TABLE articles ADD COLUMN views INTEGER DEFAULT 0`);
  } catch { /* 已存在 */ }
  try {
    database.exec(`ALTER TABLE articles ADD COLUMN likes INTEGER DEFAULT 0`);
  } catch { /* 已存在 */ }
  try {
    database.exec(`ALTER TABLE articles ADD COLUMN score REAL DEFAULT 0`);
  } catch { /* 已存在 */ }
  try {
    database.exec(`CREATE INDEX IF NOT EXISTS idx_articles_score ON articles(score DESC)`);
  } catch { /* 已存在 */ }
  try {
    database.exec(`ALTER TABLE articles ADD COLUMN category TEXT DEFAULT '其他'`);
  } catch { /* 已存在 */ }
  try {
    database.exec(`ALTER TABLE articles ADD COLUMN importance INTEGER DEFAULT 1`);
  } catch { /* 已存在 */ }
  try {
    database.exec(`ALTER TABLE competitor_updates ADD COLUMN category TEXT DEFAULT 'other'`);
  } catch { /* 已存在 */ }
  try {
    database.exec(`ALTER TABLE competitor_updates ADD COLUMN importance INTEGER DEFAULT 1`);
  } catch { /* 已存在 */ }
  try {
    database.exec(`ALTER TABLE competitor_updates ADD COLUMN source_channel TEXT`);
  } catch { /* 已存在 */ }
  try {
    database.exec(`ALTER TABLE competitor_updates ADD COLUMN product_name TEXT`);
  } catch { /* 已存在 */ }
  try {
    database.exec(`ALTER TABLE competitor_updates ADD COLUMN product_id TEXT`);
  } catch { /* 已存在 */ }
  try {
    database.exec(`ALTER TABLE competitor_products ADD COLUMN store_description TEXT`);
  } catch { /* 已存在 */ }
  database.exec(`
    UPDATE competitor_updates
    SET source_channel = CASE
      WHEN update_type = 'app_update' THEN 'Apple App Store'
      WHEN update_type = 'android_update' THEN 'Android 应用商店'
      ELSE '官方网站'
    END
    WHERE source_channel IS NULL
  `);
  try {
    database.exec(`ALTER TABLE competitors ADD COLUMN market TEXT DEFAULT 'global'`);
  } catch { /* 已存在 */ }
  try {
    database.exec(`ALTER TABLE competitors ADD COLUMN ranking INTEGER`);
  } catch { /* 已存在 */ }

  seedExtendedContent(database);

  return database;
}

function seedExtendedContent(database: Database.Database) {
  const upsertCompetitor = database.prepare(`
    INSERT INTO competitors (id, name, language, type, url, logo_url, description, market, ranking)
    VALUES (@id, @name, @language, @type, @url, @logo_url, @description, @market, @ranking)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, language = excluded.language, type = excluded.type,
      url = excluded.url, logo_url = excluded.logo_url, description = excluded.description,
      market = excluded.market, ranking = excluded.ranking
  `);
  const upsertExam = database.prepare(`
    INSERT INTO exam_events (
      id, exam_type, language, title, registration_start, registration_end,
      exam_date, result_date, source_url, source_name, description, updated_at
    ) VALUES (
      @id, @exam_type, @language, @title, @registration_start, @registration_end,
      @exam_date, @result_date, @source_url, @source_name, @description, CURRENT_TIMESTAMP
    )
    ON CONFLICT(id) DO UPDATE SET
      exam_type = excluded.exam_type, language = excluded.language, title = excluded.title,
      registration_start = excluded.registration_start, registration_end = excluded.registration_end,
      exam_date = excluded.exam_date, result_date = excluded.result_date,
      source_url = excluded.source_url, source_name = excluded.source_name,
      description = excluded.description, updated_at = CURRENT_TIMESTAMP
  `);
  const upsertProfile = database.prepare(`
    INSERT INTO competitor_profiles (
      competitor_id, supported_languages, platforms, learning_modes,
      target_audience, pricing_model, key_features
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(competitor_id) DO UPDATE SET
      supported_languages = excluded.supported_languages,
      platforms = excluded.platforms,
      learning_modes = excluded.learning_modes,
      target_audience = excluded.target_audience,
      pricing_model = excluded.pricing_model,
      key_features = excluded.key_features
  `);
  const upsertProduct = database.prepare(`
    INSERT INTO competitor_products (
      id, competitor_id, name, product_type, short_description, description,
      languages, platforms, target_audience, key_features, pricing_model,
      official_url, source_name, source_url, aliases, sort_order, status,
      last_verified_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      competitor_id = excluded.competitor_id,
      name = excluded.name,
      product_type = excluded.product_type,
      short_description = excluded.short_description,
      description = excluded.description,
      languages = excluded.languages,
      platforms = excluded.platforms,
      target_audience = excluded.target_audience,
      key_features = excluded.key_features,
      pricing_model = excluded.pricing_model,
      official_url = excluded.official_url,
      source_name = excluded.source_name,
      source_url = excluded.source_url,
      aliases = excluded.aliases,
      sort_order = excluded.sort_order,
      status = 'active'
  `);

  const transaction = database.transaction(() => {
    competitorsData.forEach((competitor) => upsertCompetitor.run({
      ...competitor,
      url: competitor.url || null,
      logo_url: competitor.logo_url || null,
    }));
    examSeeds.forEach((event) => upsertExam.run(event));
    competitorProfileSeeds.forEach((profile) => upsertProfile.run(
      profile.competitor_id,
      JSON.stringify(profile.supported_languages),
      JSON.stringify(profile.platforms),
      JSON.stringify(profile.learning_modes),
      profile.target_audience,
      profile.pricing_model,
      JSON.stringify(profile.key_features)
    ));
    productSeeds.forEach((item) => upsertProduct.run(
      item.id,
      item.competitor_id,
      item.name,
      item.product_type,
      item.short_description,
      item.description,
      JSON.stringify(item.languages),
      JSON.stringify(item.platforms),
      item.target_audience,
      JSON.stringify(item.key_features),
      item.pricing_model,
      item.official_url,
      item.source_name,
      item.source_url,
      JSON.stringify(item.aliases || []),
      item.sort_order
    ));

    const updatesWithProductName = database.prepare(`
      SELECT id, competitor_id, product_name
      FROM competitor_updates
      WHERE product_name IS NOT NULL AND product_name != ''
    `).all() as Array<{ id: string; competitor_id: string; product_name: string }>;
    const products = productSeeds.map((item) => ({
      ...item,
      matchNames: [item.name, ...(item.aliases || [])].map((name) => name.toLocaleLowerCase()),
    }));
    const linkUpdateToProduct = database.prepare(
      'UPDATE competitor_updates SET product_id = ? WHERE id = ?'
    );
    updatesWithProductName.forEach((update) => {
      const normalizedName = update.product_name.toLocaleLowerCase();
      const matched = products.find((item) =>
        item.competitor_id === update.competitor_id && item.matchNames.includes(normalizedName)
      );
      if (matched) linkUpdateToProduct.run(matched.id, update.id);
    });

    const updates = database.prepare(`
      SELECT id, title, content, update_type FROM competitor_updates
      WHERE category IS NULL OR category = 'other' OR importance IS NULL
    `).all() as Array<{ id: string; title: string; content: string | null; update_type: string | null }>;
    const updateClassification = database.prepare(
      'UPDATE competitor_updates SET category = ?, importance = ? WHERE id = ?'
    );
    updates.forEach((update) => {
      const category = classifyUpdate(update.title, update.content || '', update.update_type || '');
      updateClassification.run(category, calculateImportance(update.title, update.content || '', category), update.id);
    });
  });
  transaction();
}
