import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Password gate
    const password = request.headers.get('x-admin-password');
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getServiceSupabase();
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const search = url.searchParams.get('search') || '';
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const offset = (page - 1) * limit;

    // Fetch tracks with album info
    let query = db
      .from('tracks')
      .select('*, albums(title, share_slug, project_id)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`title.ilike.%${search}%,lyrics.ilike.%${search}%,style_prompt.ilike.%${search}%`);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: tracks, count, error } = await query;

    if (error) {
      console.error('[api/admin/tracks] Query error:', error);
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }

    // Fetch generation logs for these tracks' projects
    const projectIds = [...new Set((tracks || []).map((t: { albums: { project_id: string } | null }) => t.albums?.project_id).filter(Boolean))];

    let logs: Record<string, unknown[]> = {};
    if (projectIds.length > 0) {
      const { data: allLogs } = await db
        .from('generation_logs')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: true });

      // Group logs by project_id + track_number
      for (const log of (allLogs || [])) {
        const key = `${log.project_id}_${log.track_number ?? 'meta'}`;
        if (!logs[key]) logs[key] = [];
        logs[key].push(log);
      }
    }

    return NextResponse.json({
      tracks: tracks || [],
      logs,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error('[api/admin/tracks] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
