import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

/**
 * POST /api/log-timing
 * Fire-and-forget timing log from the frontend.
 * Tracks time-to-first-song and other UX latency metrics.
 */
export async function POST(request: NextRequest) {
  try {
    const { projectId, event, durationMs } = await request.json();

    if (!projectId || !event || typeof durationMs !== 'number') {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const db = getServiceSupabase();
    await db.from('generation_logs').insert({
      project_id: projectId,
      event,
      duration_ms: durationMs,
      model: 'frontend',
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // swallow errors — non-critical
  }
}
