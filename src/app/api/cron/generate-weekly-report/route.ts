import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyReport } from '@/lib/editorial';
import { verifyCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;
  try {
    return NextResponse.json({ success: true, result: await generateWeeklyReport(), timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Weekly report error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Weekly report failed' }, { status: 500 });
  }
}
