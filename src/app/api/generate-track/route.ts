import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generateShow } from '@/lib/generate-show';

export const maxDuration = 300; // 5 minutes

/**
 * POST /api/generate-track
 * Now serves as the single trigger for show generation.
 * Accepts { projectId } and fires generateShow() in background.
 */
export async function POST(request: NextRequest) {
  console.log('[api/generate-track] POST - Triggering show generation');
  try {
    const body = await request.json();
    const { projectId } = body as { projectId: string };

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const db = getServiceSupabase();

    // Verify project exists and has musical_type + idea
    const { data: project } = await db
      .from('projects')
      .select('id, musical_type, idea, status')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.musical_type || !project.idea) {
      return NextResponse.json({ error: 'Project missing musical_type or idea' }, { status: 400 });
    }

    // Don't re-trigger if already generating
    if (project.status !== 'intake') {
      return NextResponse.json({ error: 'Generation already started' }, { status: 409 });
    }

    console.log(`[api/generate-track] Firing show generation for ${projectId} (${project.musical_type})`);

    after(async () => {
      try {
        await generateShow(projectId);
      } catch (err) {
        console.error('[api/generate-track:after] Error:', err);
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/generate-track] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
