import { NextRequest, NextResponse } from 'next/server';
import { fetchArticles } from '@/lib/cron-tasks';
import { verifyCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;
  try {
    const totalNew = await fetchArticles();

    return NextResponse.json({
      success: true,
      message: `Fetched articles. ${totalNew} new articles added.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}
