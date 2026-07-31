import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { attachEditorial, EDITORIAL_SELECT } from '@/lib/editorial';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    initDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');
    const tag = searchParams.get('tag');
    const sort = searchParams.get('sort') || 'date'; // date | score
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ["COALESCE(language, '') != 'chinese'"];
    const params: (string | number)[] = [];

    if (language && language !== 'all') {
      whereClauses.push('language = ?');
      params.push(language);
    }

    if (tag) {
      whereClauses.push('tags LIKE ?');
      params.push(`%${tag}%`);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    const listWhereStr = whereStr
      .replace(/\blanguage\b/g, 'a.language')
      .replace(/\btags\b/g, 'a.tags');

    const total = (db.prepare(`SELECT COUNT(*) as count FROM articles ${whereStr}`).get(...params) as { count: number }).count;

    const orderBy = sort === 'score' ? 'score DESC, published_at DESC' : 'published_at DESC';

    const articles = (db.prepare(
      `SELECT a.*, ${EDITORIAL_SELECT}
       FROM articles a
       LEFT JOIN content_enrichments ce ON ce.id = (
         SELECT id FROM content_enrichments
         WHERE entity_type='article' AND entity_id=a.id AND status='published'
         ORDER BY generated_at DESC LIMIT 1
       )
       ${listWhereStr}
       ORDER BY a.${orderBy.replaceAll(', ', ', a.')} LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as Record<string, unknown>[]).map(attachEditorial);

    return NextResponse.json({
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}
