import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generateAlbumMeta } from '@/lib/generate-meta';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  console.log('[api/generate-meta] POST');
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const db = getServiceSupabase();

    const { data: project } = await db
      .from('projects')
      .select('id, status')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check we have all 3 moments
    const { data: moments } = await db
      .from('story_intake')
      .select('step')
      .eq('project_id', projectId)
      .in('step', ['moment_1', 'moment_2', 'moment_3']);

    if (!moments || moments.length < 3) {
      return NextResponse.json({ error: 'All 3 moments required' }, { status: 400 });
    }

    console.log('[api/generate-meta] Firing meta generation via after()');

    after(async () => {
      try {
        await generateAlbumMeta(projectId);
      } catch (err) {
        console.error('[api/generate-meta:after] Error:', err);
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/generate-meta] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
