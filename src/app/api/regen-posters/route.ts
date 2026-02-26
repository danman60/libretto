import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generatePosterVariants } from '@/lib/flux';
import { getMusicalTypeConfig } from '@/lib/musical-types';
import type { MusicalType, ShowConcept } from '@/lib/types';

export const maxDuration = 120;

/**
 * POST /api/regen-posters
 * Regenerate 3 poster variants for a project in 'choosing' status.
 */
export async function POST(request: NextRequest) {
  console.log('[api/regen-posters] POST');
  try {
    const { projectId } = (await request.json()) as { projectId: string };
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const db = getServiceSupabase();

    const { data: project } = await db
      .from('projects')
      .select('id, status, backstory, musical_type')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.status !== 'choosing') {
      return NextResponse.json({ error: 'Project not in choosing status' }, { status: 409 });
    }

    if (!project.backstory || !project.musical_type) {
      return NextResponse.json({ error: 'Missing backstory or musical_type' }, { status: 400 });
    }

    const concept: ShowConcept = JSON.parse(project.backstory);
    const config = getMusicalTypeConfig(project.musical_type as MusicalType);

    const posterOptions = await generatePosterVariants(concept, config);

    if (!posterOptions.length) {
      return NextResponse.json({ error: 'Failed to generate posters' }, { status: 500 });
    }

    // Save new poster options to project
    await db.from('projects').update({
      poster_options: posterOptions,
      updated_at: new Date().toISOString(),
    }).eq('id', projectId);

    console.log(`[api/regen-posters] ${posterOptions.length} new posters generated`);

    return NextResponse.json({ poster_options: posterOptions });
  } catch (err) {
    console.error('[api/regen-posters] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
