import { cache } from 'react';
import { getDb, initDb } from '@/lib/db';
import type { CompetitorProduct, ProductMedia } from '@/components/competitors/product-matrix';

export interface ProductCompetitor {
  id: string;
  name: string;
  description: string;
  url: string;
}

export interface ProductSibling {
  id: string;
  name: string;
  product_type: CompetitorProduct['product_type'];
  sort_order: number;
}

interface ProductRow extends Omit<CompetitorProduct, 'languages' | 'platforms' | 'key_features' | 'media'> {
  languages: string;
  platforms: string;
  key_features: string;
  sort_order: number;
}

function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export const getProductPageData = cache(async (competitorId: string, productId: string) => {
  initDb();
  const db = getDb();

  const competitor = db.prepare(`
    SELECT id, name, description, url
    FROM competitors
    WHERE id = ?
  `).get(competitorId) as ProductCompetitor | undefined;
  if (!competitor) return null;

  const row = db.prepare(`
    SELECT *
    FROM competitor_products
    WHERE id = ? AND competitor_id = ? AND status = 'active'
  `).get(productId, competitorId) as ProductRow | undefined;
  if (!row) return null;

  const media = db.prepare(`
    SELECT id, media_type, local_path, original_url, source_url, alt_text
    FROM product_media
    WHERE product_id = ?
    ORDER BY sort_order
    LIMIT 4
  `).all(productId) as ProductMedia[];

  const siblings = db.prepare(`
    SELECT id, name, product_type, sort_order
    FROM competitor_products
    WHERE competitor_id = ? AND status = 'active'
    ORDER BY sort_order, name
  `).all(competitorId) as ProductSibling[];

  const product: CompetitorProduct = {
    ...row,
    languages: parseList(row.languages),
    platforms: parseList(row.platforms),
    key_features: parseList(row.key_features),
    media,
  };

  return { competitor, product, siblings };
});
