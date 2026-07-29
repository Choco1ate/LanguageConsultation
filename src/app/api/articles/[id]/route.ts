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

    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Get related articles (same language or tags)
    const related = db.prepare(
      `SELECT id, title, summary, language, tags, published_at, source_name 
       FROM articles 
       WHERE id != ? AND (language = (SELECT language FROM articles WHERE id = ?) OR tags LIKE ?)
       ORDER BY published_at DESC LIMIT 5`
    ).all(id, id, '%' + (article as { tags: string }).tags?.split('"')[1] + '%');

    return NextResponse.json({ article, related });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}
