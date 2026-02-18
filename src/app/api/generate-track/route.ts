import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generateTrackFromMoment } from '@/lib/generate-track';
import type { Emotion } from '@/lib/types';

export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  console.log('[api/generate-track] POST');
  try {
    const body = await request.json();
    const { projectId, momentIndex, story, emotion } = body as {
      projectId: string;
      momentIndex: number;
      story: string;
      emotion: Emotion;
    };

    if (!projectId || !momentIndex || !story || !emotion) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (momentIndex < 1 || momentIndex > 3) {
      return NextResponse.json({ error: 'Invalid moment index' }, { status: 400 });
    }

    const db = getServiceSupabase();

    // Verify project exists
    const { data: project } = await db
      .from('projects')
      .select('id, version, allow_real_names')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Save moment to story_intake
    const step = `moment_${momentIndex}` as const;
    const content = { story, emotion };

    const { data: existing } = await db
      .from('story_intake')
      .select('id')
      .eq('project_id', projectId)
      .eq('step', step)
      .single();

    if (existing) {
      await db.from('story_intake').update({ content }).eq('id', existing.id);
    } else {
      await db.from('story_intake').insert({ project_id: projectId, step, content });
    }

    console.log(`[api/generate-track] Saved moment ${momentIndex}, firing generation via after()`);

    // Fire generation in background — AI infers music style from story
    after(async () => {
      try {
        await generateTrackFromMoment(
          projectId,
          momentIndex,
          story,
          emotion,
          project.allow_real_names || false
        );
      } catch (err) {
        console.error(`[api/generate-track:after] Error:`, err);
      }
    });

    return NextResponse.json({ success: true, momentIndex });
  } catch (err) {
    console.error('[api/generate-track] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
