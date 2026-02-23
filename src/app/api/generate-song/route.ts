import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generateSingleSong, maybeFinalizeProject } from '@/lib/generate-show';
import type { MusicalType, ShowConcept } from '@/lib/types';

export const maxDuration = 300; // 5 minutes — audio generation can take a while

/**
 * POST /api/generate-song
 * Per-track worker: generates audio for a single track.
 * Called by the orchestrator for track 1, and by the frontend for tracks 2-6.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, trackNumber } = body as { projectId: string; trackNumber: number };

    if (!projectId || !trackNumber) {
      return NextResponse.json({ error: 'Missing projectId or trackNumber' }, { status: 400 });
    }

    if (trackNumber < 1 || trackNumber > 6) {
      return NextResponse.json({ error: 'trackNumber must be 1-6' }, { status: 400 });
    }

    const db = getServiceSupabase();

    // Fetch project for concept + musicalType
    const { data: project } = await db
      .from('projects')
      .select('id, musical_type, backstory')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.musical_type || !project.backstory) {
      return NextResponse.json({ error: 'Project not yet enriched' }, { status: 400 });
    }

    // Idempotency guard: reject if track already generating or complete
    const { data: track } = await db
      .from('tracks')
      .select('status')
      .eq('project_id', projectId)
      .eq('track_number', trackNumber)
      .single();

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (track.status === 'generating_audio' || track.status === 'complete') {
      return NextResponse.json({ error: `Track already ${track.status}` }, { status: 409 });
    }

    const musicalType = project.musical_type as MusicalType;
    const concept = JSON.parse(project.backstory) as ShowConcept;

    console.log(`[api/generate-song] Generating audio for track ${trackNumber} of project ${projectId}`);

    // Generate the song (lyrics if needed + audio)
    await generateSingleSong(projectId, trackNumber, concept, musicalType);

    // Check if all tracks are done → finalize project
    await maybeFinalizeProject(projectId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/generate-song] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
