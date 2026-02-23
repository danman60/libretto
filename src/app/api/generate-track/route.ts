import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import {
  doEnrichment,
  createPlaceholders,
  generateLyricsOnly,
  generatePlaybillAndAlbum,
} from '@/lib/generate-show';
import type { MusicalType, ShowConcept } from '@/lib/types';

export const maxDuration = 300; // 5 minutes

/**
 * POST /api/generate-track
 * Orchestrator: enrichment -> placeholders -> playbill+album (get slug) ->
 * track 1 lyrics -> fire track 1 audio (fire-and-forget).
 * Returns share_slug so frontend can redirect immediately.
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

    // Step 2: Create 6 track placeholders
    await createPlaceholders(projectId, musicalType);

    // Step 3: Generate playbill + album immediately (gives us share_slug)
    let shareSlug: string;
    try {
      shareSlug = await generatePlaybillAndAlbum(projectId, concept, musicalType);
    } catch (err) {
      console.error('[api/generate-track] Playbill/album failed:', err);
      return NextResponse.json({ error: 'Album creation failed' }, { status: 500 });
    }

    // Step 4: Generate lyrics for track 1 only
    console.log('[api/generate-track] Generating track 1 lyrics...');
    await generateLyricsOnly(projectId, 1, concept, musicalType);

    // Step 5: Fire /api/generate-song for track 1 only (fire-and-forget)
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    console.log('[api/generate-track] Firing track 1 audio generation...');
    fetch(`${baseUrl}/api/generate-song`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, trackNumber: 1 }),
    }).catch(err => {
      console.error('[api/generate-track] Failed to fire track 1:', err);
    });

    return NextResponse.json({ success: true, share_slug: shareSlug });
  } catch (err) {
    console.error('[api/generate-track] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
