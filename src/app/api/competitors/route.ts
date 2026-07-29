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
        (SELECT cu.title FROM competitor_updates cu WHERE cu.competitor_id = c.id ORDER BY datetime(COALESCE(cu.published_at, cu.created_at)) DESC LIMIT 1) as latest_update_title,
        (SELECT COALESCE(cu.published_at, cu.created_at) FROM competitor_updates cu WHERE cu.competitor_id = c.id ORDER BY datetime(COALESCE(cu.published_at, cu.created_at)) DESC LIMIT 1) as latest_update_date,
        (SELECT COUNT(*) FROM competitor_updates cu WHERE cu.competitor_id = c.id) as update_count,
        (SELECT ce.editorial_summary FROM competitor_updates cu JOIN content_enrichments ce
          ON ce.entity_type='competitor_update' AND ce.entity_id=cu.id AND ce.status='published'
          WHERE cu.competitor_id=c.id ORDER BY datetime(COALESCE(cu.published_at,cu.created_at)) DESC LIMIT 1) AS latest_update_summary,
        (SELECT ce.why_it_matters FROM competitor_updates cu JOIN content_enrichments ce
          ON ce.entity_type='competitor_update' AND ce.entity_id=cu.id AND ce.status='published'
          WHERE cu.competitor_id=c.id ORDER BY datetime(COALESCE(cu.published_at,cu.created_at)) DESC LIMIT 1) AS latest_update_impact,
        (SELECT ce.category FROM competitor_updates cu JOIN content_enrichments ce
          ON ce.entity_type='competitor_update' AND ce.entity_id=cu.id AND ce.status='published'
          WHERE cu.competitor_id=c.id ORDER BY datetime(COALESCE(cu.published_at,cu.created_at)) DESC LIMIT 1) AS latest_update_category
      FROM competitors c
    `;
    
    const whereClauses = ["c.market = 'cn'", 'c.ranking BETWEEN 1 AND 10'];
    const params: string[] = [];
    if (language && language !== 'all') {
      whereClauses.push('(c.language = ? OR c.language = ?)');
      params.push(language, 'multi');
    }

    query += ` WHERE ${whereClauses.join(' AND ')}`;
    query += ' ORDER BY datetime(latest_update_date) DESC, c.ranking ASC';

    const competitors = db.prepare(query).all(...params);
    return NextResponse.json(competitors);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch competitors' }, { status: 500 });
  }
}
