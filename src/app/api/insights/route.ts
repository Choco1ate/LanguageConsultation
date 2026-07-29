import { NextRequest, NextResponse } from 'next/server';
import { getInsights, normalizeRange } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const range = normalizeRange(request.nextUrl.searchParams.get('range'));
    const language = request.nextUrl.searchParams.get('language');
    return NextResponse.json(getInsights(range, language));
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json({ error: 'Failed to load insights' }, { status: 500 });
  }
}

