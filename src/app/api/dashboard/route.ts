import { NextRequest, NextResponse } from 'next/server';
import { getDashboard, normalizeRange } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const range = normalizeRange(request.nextUrl.searchParams.get('range'));
    return NextResponse.json(getDashboard(range));
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}

