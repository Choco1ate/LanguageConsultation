import { NextRequest, NextResponse } from 'next/server';
import { enrichContent, generateDailyBrief } from '@/lib/editorial';
import { verifyCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json().catch(() => ({})) as { limit?: number; backfill?: boolean };
    const result = await enrichContent({ limit: body.limit || 30, backfill: Boolean(body.backfill) });
    const brief = await generateDailyBrief();
    return NextResponse.json({ success: true, result, brief, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Content enrichment error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Content enrichment failed' }, { status: 500 });
  }
}
