import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';
import { generateTrendDigest } from '@/lib/editorial';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;
  try {
    const results = await Promise.all([
      generateTrendDigest('7d'),
      generateTrendDigest('30d'),
    ]);
    return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Trend digest job failed:', error);
    return NextResponse.json({ error: 'Failed to generate trend digests' }, { status: 500 });
  }
}
