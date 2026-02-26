import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { callDeepSeekJSON } from '@/lib/deepseek';
import { buildTitleRegenPrompt } from '@/lib/prompts';
import type { ShowConcept } from '@/lib/types';

/**
 * POST /api/regen-titles
 * Regenerate 3 title options for a project in 'choosing' status.
 */
export async function POST(request: NextRequest) {
  console.log('[api/regen-titles] POST');
  try {
    const { projectId } = (await request.json()) as { projectId: string };
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const db = getServiceSupabase();

    const { data: project } = await db
      .from('projects')
      .select('id, status, backstory')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.status !== 'choosing') {
      return NextResponse.json({ error: 'Project not in choosing status' }, { status: 409 });
    }

    if (!project.backstory) {
      return NextResponse.json({ error: 'No backstory' }, { status: 400 });
    }

    const concept: ShowConcept = JSON.parse(project.backstory);
    const existingTitles = concept.title_options.map(t => t.title);

    const result = await callDeepSeekJSON<{ title_options: { title: string; tagline: string }[] }>(
      buildTitleRegenPrompt(concept, existingTitles)
    );

    if (!result.title_options?.length) {
      return NextResponse.json({ error: 'Failed to generate titles' }, { status: 500 });
    }

    // Update backstory with new titles
    concept.title_options = result.title_options;
    concept.recommended_title = 0;

    await db.from('projects').update({
      backstory: JSON.stringify(concept),
      updated_at: new Date().toISOString(),
    }).eq('id', projectId);

    console.log('[api/regen-titles] New titles:', result.title_options.map(t => t.title).join(', '));

    return NextResponse.json({ title_options: result.title_options });
  } catch (err) {
    console.error('[api/regen-titles] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
