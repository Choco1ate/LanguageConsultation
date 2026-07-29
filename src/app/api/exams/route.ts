import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    initDb();
    const db = getDb();
    const { searchParams } = request.nextUrl;
    const language = searchParams.get('language');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const where: string[] = [];
    const params: string[] = [];

    if (language && language !== 'all') {
      where.push('language = ?');
      params.push(language);
    }
    if (from) {
      where.push('(exam_date IS NULL OR exam_date >= ?)');
      params.push(from);
    }
    if (to) {
      where.push('(exam_date IS NULL OR exam_date <= ?)');
      params.push(to);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const events = db.prepare(`
      SELECT * FROM exam_events ${clause}
      ORDER BY exam_date IS NULL, exam_date ASC, exam_type ASC
    `).all(...params);
    return NextResponse.json({ events, total: events.length });
  } catch (error) {
    console.error('Exams API error:', error);
    return NextResponse.json({ error: 'Failed to load exams' }, { status: 500 });
  }
}

