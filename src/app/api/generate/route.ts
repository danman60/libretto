import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { runPipeline } from '@/lib/pipeline';

export const maxDuration = 300; // 5 minutes (Vercel Pro limit)

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const db = getServiceSupabase();

    // Verify project exists and is in intake state
    const { data: project } = await db
      .from('projects')
      .select('id, status')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

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

    if (!hasAll || !prefs) {
      return NextResponse.json({ error: 'Incomplete intake data' }, { status: 400 });
    }

    // Fire off the pipeline — don't await, let it run in the background.
    // On Vercel, this route stays alive for maxDuration.
    // The pipeline updates Supabase at each step; client polls /api/status.
    runPipeline(projectId).catch((err) => {
      console.error('Pipeline background error:', err);
    });

    return NextResponse.json({ success: true, projectId });
  } catch (err) {
    console.error('Generate kickoff error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
