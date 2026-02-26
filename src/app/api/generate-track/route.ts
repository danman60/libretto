import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import {
  doEnrichment,
  createPlaceholders,
  generateLyricsAndSubmitAudio,
} from '@/lib/generate-show';
import { generatePosterVariants } from '@/lib/flux';
import { getMusicalTypeConfig } from '@/lib/musical-types';
import type { MusicalType, ShowConcept } from '@/lib/types';

export const maxDuration = 300; // 5 minutes

/**
 * POST /api/generate-track
 * Orchestrator: enrichment -> placeholders -> set choosing -> parallel(track 1 + poster variants) -> return.
 * Track 1 lyrics+audio fires immediately after enrichment.
 * Poster variants arrive ~5-10s later for the choice gate.
 * Playbill + album creation deferred to /api/finalize-show.
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

    if (project.status !== 'intake') {
      return NextResponse.json({ error: 'Generation already started' }, { status: 409 });
    }

    const musicalType = project.musical_type as MusicalType;
    const config = getMusicalTypeConfig(musicalType);

    console.log(`[api/generate-track] Starting orchestration for ${projectId} (${musicalType})`);

    // Step 1: Enrichment (~23s)
    let concept: ShowConcept;
    try {
      concept = await doEnrichment(projectId, project.idea, musicalType);
    } catch (err) {
      console.error('[api/generate-track] Enrichment failed:', err);
      await db.from('projects').update({ status: 'failed' }).eq('id', projectId);
      return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 });
    }

    // Step 2: Create track placeholders
    await createPlaceholders(projectId, musicalType);

    // Step 3: Set status to 'choosing' — frontend detects this and shows title picker
    await db.from('projects').update({
      status: 'choosing',
      updated_at: new Date().toISOString(),
    }).eq('id', projectId);

    console.log('[api/generate-track] Status set to choosing. Firing parallel: track 1 + poster variants');

    // Step 4: Fire track 1 lyrics+audio AND 3 poster variants in parallel
    const [, posterResult] = await Promise.allSettled([
      // Track 1 lyrics + immediate KIE submit
      generateLyricsAndSubmitAudio(projectId, 1, concept, musicalType),
      // 3 FLUX poster variants (~5-10s each, parallel)
      generatePosterVariants(concept, config).catch(err => {
        console.error('[api/generate-track] Poster variants failed (non-fatal):', err);
        return [];
      }),
    ]);

    // Step 5: Save poster URLs to projects.poster_options
    // Always save (even empty array) so the frontend knows posters are done loading
    const posterOptions = posterResult.status === 'fulfilled' ? posterResult.value : [];
    await db.from('projects').update({
      poster_options: posterOptions,
      updated_at: new Date().toISOString(),
    }).eq('id', projectId);
    if (posterOptions.length > 0) {
      console.log(`[api/generate-track] Saved ${posterOptions.length} poster options`);
    } else {
      console.warn('[api/generate-track] All poster variants failed — saved empty array');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/generate-track] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
