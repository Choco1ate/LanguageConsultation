import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    initDb();
    const ids = (request.nextUrl.searchParams.get('ids') || '')
      .split(',').map((id) => id.trim()).filter(Boolean);
    if (ids.length < 2 || ids.length > 4) {
      return NextResponse.json({ error: '请选择 2–4 个平台进行对比' }, { status: 400 });
    }
    const db = getDb();
    const placeholders = ids.map(() => '?').join(',');
    const rows = db.prepare(`
      SELECT c.*, cp.supported_languages, cp.platforms, cp.learning_modes,
        cp.target_audience, cp.pricing_model, cp.key_features,
        (SELECT COUNT(*) FROM competitor_products p
          WHERE p.competitor_id=c.id AND p.status='active') AS product_count,
        (SELECT MAX(p.last_verified_at) FROM competitor_products p
          WHERE p.competitor_id=c.id AND p.status='active') AS last_verified_at,
        (SELECT COUNT(*) FROM source_snapshots ss
          WHERE ss.competitor_id=c.id AND ss.status='success') AS snapshot_count,
        (SELECT COUNT(*) FROM competitor_updates cu
          WHERE cu.competitor_id = c.id
          AND datetime(COALESCE(cu.published_at, cu.created_at)) >= datetime('now', '-29 days')
        ) AS updates_30d,
        (SELECT COUNT(*) FROM competitor_updates cu
          WHERE cu.competitor_id = c.id AND cu.category != 'version_maintenance'
          AND datetime(COALESCE(cu.published_at, cu.created_at)) >= datetime('now', '-29 days')
        ) AS meaningful_updates_30d,
        (SELECT COUNT(*) FROM competitor_updates cu
          WHERE cu.competitor_id = c.id AND cu.category = 'version_maintenance'
          AND datetime(COALESCE(cu.published_at, cu.created_at)) >= datetime('now', '-29 days')
        ) AS maintenance_updates_30d,
        (SELECT COUNT(*) FROM competitor_updates cu
          WHERE cu.competitor_id = c.id AND cu.category != 'version_maintenance'
          AND datetime(COALESCE(cu.published_at, cu.created_at)) >= datetime('now', '-89 days')
        ) AS meaningful_updates_90d,
        (SELECT MAX(COALESCE(cu.published_at, cu.created_at)) FROM competitor_updates cu
          WHERE cu.competitor_id = c.id) AS latest_update_date
      FROM competitors c LEFT JOIN competitor_profiles cp ON cp.competitor_id = c.id
      WHERE c.market = 'cn' AND c.ranking BETWEEN 1 AND 10
        AND c.id IN (${placeholders})
    `).all(...ids) as Array<Record<string, unknown>>;
    const productRows = db.prepare(`
      SELECT competitor_id, name, product_type, pricing_model
      FROM competitor_products
      WHERE status='active' AND competitor_id IN (${placeholders})
      ORDER BY sort_order ASC
    `).all(...ids) as Array<Record<string, unknown>>;
    const categoryRows = db.prepare(`
      SELECT competitor_id, category, COUNT(*) AS count
      FROM competitor_updates
      WHERE competitor_id IN (${placeholders})
        AND datetime(COALESCE(published_at, created_at)) >= datetime('now', '-89 days')
      GROUP BY competitor_id, category
      ORDER BY count DESC
    `).all(...ids) as Array<Record<string, unknown>>;
    const byId = new Map(rows.map((row) => [row.id, row]));
    const competitors = ids.map((id) => byId.get(id)).filter(Boolean).map((row) => ({
      ...row,
      supported_languages: JSON.parse(String(row?.supported_languages || '[]')),
      platforms: JSON.parse(String(row?.platforms || '[]')),
      learning_modes: JSON.parse(String(row?.learning_modes || '[]')),
      key_features: JSON.parse(String(row?.key_features || '[]')),
      products: productRows.filter((item) => item.competitor_id === row?.id).map((item) => ({
        name: String(item.name),
        type: String(item.product_type),
        pricingModel: String(item.pricing_model || ''),
      })),
      product_types: [...new Set(productRows.filter((item) => item.competitor_id === row?.id).map((item) => String(item.product_type)))],
      update_categories: categoryRows.filter((item) => item.competitor_id === row?.id).map((item) => ({
        key: String(item.category),
        count: Number(item.count),
      })),
      profile_completeness: [
        row?.supported_languages, row?.platforms, row?.learning_modes,
        row?.target_audience, row?.pricing_model, row?.key_features, row?.description,
      ].filter((value) => value && value !== '[]').length,
    }));
    return NextResponse.json({ competitors });
  } catch (error) {
    console.error('Compare API error:', error);
    return NextResponse.json({ error: 'Failed to compare competitors' }, { status: 500 });
  }
}
