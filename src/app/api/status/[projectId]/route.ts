import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    console.log('[api/status] GET for project:', projectId);
    const db = getServiceSupabase();

    const { data: project, error: projectError } = await db
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('[api/status] Project fetch error:', projectError);
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { data: tracks } = await db
      .from('tracks')
      .select('*')
      .eq('project_id', projectId)
      .order('track_number');

    const { data: album } = await db
      .from('albums')
      .select('*')
      .eq('project_id', projectId)
      .single();

    console.log('[api/status] Status:', project.status, 'Tracks:', tracks?.length || 0, 'Album:', !!album);

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
