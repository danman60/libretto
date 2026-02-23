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

    // Fetch tracks (no join — tracks and albums are siblings under projects)
    let query = db
      .from('tracks')
      .select('*', { count: 'exact' })
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
      return NextResponse.json({ error: 'Query failed', detail: error.message }, { status: 500 });
    }

    // Fetch album info for these tracks' projects
    const projectIds = [...new Set((tracks || []).map((t: { project_id: string }) => t.project_id))];

    let albumsByProject: Record<string, { title: string; share_slug: string | null }> = {};
    if (projectIds.length > 0) {
      const { data: albums } = await db
        .from('albums')
        .select('project_id, title, share_slug')
        .in('project_id', projectIds);

      for (const album of (albums || [])) {
        albumsByProject[album.project_id] = { title: album.title, share_slug: album.share_slug };
      }
    }

    // Attach album info to each track
    const tracksWithAlbums = (tracks || []).map((t: { project_id: string }) => ({
      ...t,
      albums: albumsByProject[t.project_id] || null,
    }));

    // Fetch generation logs
    let logs: Record<string, unknown[]> = {};
    if (projectIds.length > 0) {
      const { data: allLogs } = await db
        .from('generation_logs')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: true });

      for (const log of (allLogs || [])) {
        const key = `${log.project_id}_${log.track_number ?? 'meta'}`;
        if (!logs[key]) logs[key] = [];
        logs[key].push(log);
      }
    }

    return NextResponse.json({
      tracks: tracksWithAlbums,
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
