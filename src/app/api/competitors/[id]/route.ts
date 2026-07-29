import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

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

    const updates = db.prepare(
      'SELECT * FROM competitor_updates WHERE competitor_id = ? ORDER BY published_at DESC'
    ).all(id);

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
