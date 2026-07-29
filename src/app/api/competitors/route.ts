import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    initDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');

    let query = `
      SELECT c.*, 
        (SELECT cu.title FROM competitor_updates cu WHERE cu.competitor_id = c.id ORDER BY cu.published_at DESC LIMIT 1) as latest_update_title,
        (SELECT cu.published_at FROM competitor_updates cu WHERE cu.competitor_id = c.id ORDER BY cu.published_at DESC LIMIT 1) as latest_update_date,
        (SELECT COUNT(*) FROM competitor_updates cu WHERE cu.competitor_id = c.id) as update_count
      FROM competitors c
    `;
    
    const whereClauses = ["c.market = 'cn'", 'c.ranking BETWEEN 1 AND 10'];
    const params: string[] = [];
    if (language && language !== 'all') {
      whereClauses.push('(c.language = ? OR c.language = ?)');
      params.push(language, 'multi');
    }

    query += ` WHERE ${whereClauses.join(' AND ')}`;
    query += ' ORDER BY c.ranking ASC';

    const competitors = db.prepare(query).all(...params);
    return NextResponse.json(competitors);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch competitors' }, { status: 500 });
  }
}
