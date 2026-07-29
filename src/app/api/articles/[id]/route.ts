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

    const rawArticle = db.prepare(`SELECT a.*, ${EDITORIAL_SELECT}
      FROM articles a LEFT JOIN content_enrichments ce ON ce.id = (
        SELECT id FROM content_enrichments WHERE entity_type='article' AND entity_id=a.id AND status='published'
        ORDER BY generated_at DESC LIMIT 1
      ) WHERE a.id = ?`).get(id) as Record<string, unknown> | undefined;
    const article = rawArticle ? attachEditorial(rawArticle) : null;
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Get related articles (same language or tags)
    const related = db.prepare(
      `SELECT id, title, summary, language, tags, published_at, source_name 
       FROM articles 
       WHERE id != ? AND (language = (SELECT language FROM articles WHERE id = ?) OR tags LIKE ?)
       ORDER BY published_at DESC LIMIT 5`
    ).all(id, id, '%' + String((article as { tags?: string }).tags || '').split('"')[1] + '%');

    return NextResponse.json({ article, related });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}
