import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import {
  doEnrichment,
  createPlaceholders,
  generateLyricsOnly,
  generatePlaybillAndAlbum,
} from '@/lib/generate-show';
import { generatePoster } from '@/lib/flux';
import { getMusicalTypeConfig } from '@/lib/musical-types';
import type { MusicalType, ShowConcept } from '@/lib/types';

export const maxDuration = 300; // 5 minutes

/**
 * POST /api/generate-track
 * Orchestrator: enrichment -> (poster + playbill + placeholders + lyrics in parallel) -> return slug.
 * FLUX poster (~5s) runs alongside playbill (~10s) and lyrics (~15s).
 * Audio generation triggered separately by frontend.
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

    // Step 2: Create placeholders first (lyrics generation needs track rows)
    await createPlaceholders(projectId, musicalType);

    // Step 3: Fire poster + playbill + track 1 lyrics ALL in parallel
    // FLUX poster ~5s, playbill ~10s, lyrics ~15s — all independent
    console.log('[api/generate-track] Firing parallel: poster + playbill + track 1 lyrics');

    const [posterResult, playbillResult, ] = await Promise.allSettled([
      // FLUX poster (~5s) — non-fatal if it fails
      generatePoster(concept, config).catch(err => {
        console.error('[api/generate-track] Poster generation failed (non-fatal):', err);
        return null;
      }),
      // Playbill + album (~10s)
      generatePlaybillAndAlbum(projectId, concept, musicalType),
      // Track 1 lyrics (~15s)
      generateLyricsOnly(projectId, 1, concept, musicalType),
    ]);

    // Extract poster URL (may be null if FLUX failed — non-fatal)
    const posterUrl = posterResult.status === 'fulfilled' ? posterResult.value : null;

    // Extract share slug from playbill result
    if (playbillResult.status === 'rejected') {
      console.error('[api/generate-track] Playbill/album failed:', playbillResult.reason);
      return NextResponse.json({ error: 'Album creation failed' }, { status: 500 });
    }
    const shareSlug = playbillResult.value;

    // Backfill poster URL onto album if FLUX succeeded
    if (posterUrl) {
      console.log('[api/generate-track] Backfilling FLUX poster onto album');
      await db.from('albums')
        .update({ cover_image_url: posterUrl })
        .eq('project_id', projectId);
    }

    // Audio generation is triggered by the frontend (album page) when it
    // detects lyrics_complete. This gives it a fresh 5-min serverless timeout.

    return NextResponse.json({ success: true, share_slug: shareSlug });
  } catch (err) {
    console.error('[api/generate-track] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
