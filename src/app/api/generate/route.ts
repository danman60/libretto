import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { runPipeline } from '@/lib/pipeline';

export const maxDuration = 300; // 5 minutes (Vercel Pro limit)

export async function POST(request: NextRequest) {
  console.log('[api/generate] POST');
  try {
    const { projectId } = await request.json();
    console.log('[api/generate] projectId:', projectId);

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const db = getServiceSupabase();

    // Verify project exists and is in intake state
    const { data: project, error: projectError } = await db
      .from('projects')
      .select('id, status')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('[api/generate] Project fetch error:', projectError);
    }

    if (!project) {
      console.log('[api/generate] Project not found');
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log('[api/generate] Project status:', project.status);

    if (project.status !== 'intake') {
      return NextResponse.json({ error: 'Generation already started' }, { status: 409 });
    }

    // Verify all intake steps are complete
    const { data: intakeRows } = await db
      .from('story_intake')
      .select('step')
      .eq('project_id', projectId);

    const { data: prefs } = await db
      .from('music_preferences')
      .select('id')
      .eq('project_id', projectId)
      .single();

    const steps = (intakeRows || []).map((r: { step: string }) => r.step);
    const hasAll = ['turning_points', 'inner_world', 'scenes'].every((s) => steps.includes(s));

    console.log('[api/generate] Intake steps:', steps, 'hasAll:', hasAll, 'hasPrefs:', !!prefs);

    if (!hasAll || !prefs) {
      return NextResponse.json({ error: 'Incomplete intake data' }, { status: 400 });
    }

    // Fire off the pipeline — don't await, let it run in the background.
    console.log('[api/generate] Firing pipeline...');
    runPipeline(projectId).catch((err) => {
      console.error('[api/generate] Pipeline background error:', err);
    });

    return NextResponse.json({ success: true, projectId });
  } catch (err) {
    console.error('[api/generate] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
