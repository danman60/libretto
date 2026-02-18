import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const db = getServiceSupabase();

    const { data: project } = await db
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

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

    return NextResponse.json({
      project,
      tracks: tracks || [],
      album: album || null,
    });
  } catch (err) {
    console.error('Status error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
