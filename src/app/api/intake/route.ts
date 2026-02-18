import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import type { IntakeStep } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, step, content } = body as {
      projectId: string;
      step: IntakeStep;
      content: unknown;
    };

    if (!projectId || !step || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validSteps: IntakeStep[] = ['turning_points', 'inner_world', 'scenes'];
    if (!validSteps.includes(step)) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    const db = getServiceSupabase();

    // Upsert — replace if this step already exists for this project
    const { data: existing } = await db
      .from('story_intake')
      .select('id')
      .eq('project_id', projectId)
      .eq('step', step)
      .single();

    if (existing) {
      const { error } = await db
        .from('story_intake')
        .update({ content })
        .eq('id', existing.id);

      if (error) {
        console.error('Intake update error:', error);
        return NextResponse.json({ error: 'Failed to update intake' }, { status: 500 });
      }
    } else {
      const { error } = await db
        .from('story_intake')
        .insert({ project_id: projectId, step, content });

      if (error) {
        console.error('Intake insert error:', error);
        return NextResponse.json({ error: 'Failed to save intake' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Intake error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
