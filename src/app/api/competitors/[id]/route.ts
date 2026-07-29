import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { attachEditorial, EDITORIAL_SELECT } from '@/lib/editorial';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const db = getDb();
    const { id } = await params;

    const competitor = db.prepare('SELECT * FROM competitors WHERE id = ?').get(id);
    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }

    const updates = (db.prepare(`
      SELECT cu.*, ${EDITORIAL_SELECT}
      FROM competitor_updates cu
      LEFT JOIN content_enrichments ce ON ce.id = (
        SELECT id FROM content_enrichments
        WHERE entity_type='competitor_update' AND entity_id=cu.id AND status='published'
        ORDER BY generated_at DESC LIMIT 1
      )
      WHERE cu.competitor_id = ?
      ORDER BY datetime(COALESCE(cu.published_at,cu.created_at)) DESC
    `).all(id) as Record<string, unknown>[]).map(attachEditorial);

    const productRows = db.prepare(`
      SELECT * FROM competitor_products
      WHERE competitor_id = ? AND status = 'active'
      ORDER BY sort_order, name
    `).all(id) as Array<Record<string, unknown> & { id: string }>;
    const mediaStatement = db.prepare(`
      SELECT id, media_type, local_path, original_url, source_url,
             alt_text, sort_order, captured_at
      FROM product_media
      WHERE product_id = ?
      ORDER BY sort_order
      LIMIT 4
    `);
    const products = productRows.map((product) => ({
      ...product,
      languages: JSON.parse(String(product.languages || '[]')),
      platforms: JSON.parse(String(product.platforms || '[]')),
      key_features: JSON.parse(String(product.key_features || '[]')),
      aliases: undefined,
      media: mediaStatement.all(product.id),
    }));

    return NextResponse.json({ competitor, products, updates });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch competitor details' }, { status: 500 });
  }
}
