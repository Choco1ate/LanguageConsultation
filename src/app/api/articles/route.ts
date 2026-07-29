import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    initDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');
    const tag = searchParams.get('tag');
    const sort = searchParams.get('sort') || 'date'; // date | score
    const chineseOnly = searchParams.get('chinese') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    if (language && language !== 'all') {
      whereClauses.push('language = ?');
      params.push(language);
    } else if (chineseOnly) {
      // 仅在未选择具体语种时应用中文筛选
      whereClauses.push('language = ?');
      params.push('chinese');
    }

    if (tag) {
      whereClauses.push('tags LIKE ?');
      params.push(`%${tag}%`);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const total = (db.prepare(`SELECT COUNT(*) as count FROM articles ${whereStr}`).get(...params) as { count: number }).count;

    const orderBy = sort === 'score' ? 'score DESC, published_at DESC' : 'published_at DESC';

    const articles = db.prepare(
      `SELECT * FROM articles ${whereStr} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

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
