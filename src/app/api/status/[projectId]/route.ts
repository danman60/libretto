import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// Track last-seen status per project to avoid spamming identical log lines
const lastStatus = new Map<string, string>();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const db = getServiceSupabase();

    const { data: project, error: projectError } = await db
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('[api/status] Project fetch error:', projectError.message);
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { data: tracks } = await db
      .from('tracks')
      .select('*')
      .eq('project_id', projectId)
      .order('track_number');

    // maybeSingle() returns null when 0 rows — avoids PostgREST 406
    const { data: album } = await db
      .from('albums')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    // Only log when status changes (cuts log noise from 2.5s polling)
    const prev = lastStatus.get(projectId);
    const current = `${project.status}|t${tracks?.length || 0}|a${!!album}`;
    if (prev !== current) {
      lastStatus.set(projectId, current);
      console.log(`[api/status] ${projectId.slice(0, 8)} → status=${project.status} tracks=${tracks?.length || 0} album=${!!album}`);
    }

    return NextResponse.json({
      project,
      tracks: tracks || [],
      album: album || null,
    });
  } catch (err) {
    console.error('[api/status] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
