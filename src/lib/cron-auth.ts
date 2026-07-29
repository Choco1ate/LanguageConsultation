import { NextRequest, NextResponse } from 'next/server';

export function verifyCronRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV !== 'production') return null;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }
  const bearer = request.headers.get('authorization');
  const headerSecret = request.headers.get('x-cron-secret');
  if (bearer !== `Bearer ${secret}` && headerSecret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

