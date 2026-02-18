import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
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

    // Allow re-entry for resumable pipeline (intake = fresh start, generating_music = resume)
    const allowedStatuses = ['intake', 'processing', 'generating_music'];
    if (!allowedStatuses.includes(project.status)) {
      if (project.status === 'complete') {
        return NextResponse.json({ error: 'Generation already complete' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Generation already started' }, { status: 409 });
    }

    const isResume = project.status !== 'intake';

    // Skip intake validation on resume — data already verified on first run
    if (!isResume) {
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
    } else {
      console.log('[api/generate] Resuming — skipping intake validation');
    }

    // Use next/server after() to run pipeline after response is sent.
    // This keeps the serverless function alive for maxDuration while
    // immediately returning 200 to the client.
    console.log('[api/generate] Scheduling pipeline via after()...');
    after(async () => {
      console.log('[api/generate:after] Pipeline starting...');
      try {
        await runPipeline(projectId);
        console.log('[api/generate:after] Pipeline completed successfully');
      } catch (err) {
        console.error('[api/generate:after] Pipeline error:', err);
      }
    });

    return NextResponse.json({ success: true, projectId });
  } catch (err) {
    console.error('[api/generate] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
