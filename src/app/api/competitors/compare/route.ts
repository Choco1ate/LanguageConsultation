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
        (SELECT COUNT(*) FROM competitor_updates cu
          WHERE cu.competitor_id = c.id
          AND datetime(COALESCE(cu.published_at, cu.created_at)) >= datetime('now', '-29 days')
        ) AS updates_30d,
        (SELECT MAX(COALESCE(cu.published_at, cu.created_at)) FROM competitor_updates cu
          WHERE cu.competitor_id = c.id) AS latest_update_date
      FROM competitors c LEFT JOIN competitor_profiles cp ON cp.competitor_id = c.id
      WHERE c.market = 'cn' AND c.ranking BETWEEN 1 AND 10
        AND c.id IN (${placeholders})
    `).all(...ids) as Array<Record<string, unknown>>;
    const byId = new Map(rows.map((row) => [row.id, row]));
    const competitors = ids.map((id) => byId.get(id)).filter(Boolean).map((row) => ({
      ...row,
      supported_languages: JSON.parse(String(row?.supported_languages || '[]')),
      platforms: JSON.parse(String(row?.platforms || '[]')),
      learning_modes: JSON.parse(String(row?.learning_modes || '[]')),
      key_features: JSON.parse(String(row?.key_features || '[]')),
    }));
    return NextResponse.json({ competitors });
  } catch (error) {
    console.error('Compare API error:', error);
    return NextResponse.json({ error: 'Failed to compare competitors' }, { status: 500 });
  }
}
