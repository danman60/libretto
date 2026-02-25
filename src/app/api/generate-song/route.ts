import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { submitKieWithWebhook } from '@/lib/suno-kie';
import { logGeneration } from '@/lib/log-generation';
import { getMusicalTypeConfig, getSongRoles } from '@/lib/musical-types';
import { buildSongLyricsPrompt, buildSongStylePrompt } from '@/lib/prompts';
import { callDeepSeek } from '@/lib/deepseek';
import type { MusicalType, ShowConcept } from '@/lib/types';

export const maxDuration = 60; // Only needs ~15s for lyrics + KIE submit (webhook handles the rest)

/**
 * POST /api/generate-song
 * Per-track worker: generates lyrics (if needed) + submits audio to KIE.
 * Returns immediately after KIE submission — webhook handles completion.
 *
 * Called by the frontend (album page auto-trigger + manual unlock).
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
      .select('status, lyrics, style_prompt')
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
    const config = getMusicalTypeConfig(musicalType);
    const songRoles = getSongRoles(musicalType);
    const songConfig = songRoles[trackNumber - 1];

    let lyrics = track.lyrics;
    let stylePrompt = track.style_prompt;

    // Generate lyrics if not yet done
    if (!lyrics) {
      console.log(`[api/generate-song] Track ${trackNumber}: generating lyrics first...`);
      await db.from('tracks').update({
        status: 'generating_lyrics',
        updated_at: new Date().toISOString(),
      }).eq('project_id', projectId).eq('track_number', trackNumber);

      await logGeneration({ projectId, trackNumber, event: 'lyrics_started', model: 'deepseek-chat' });
      const lyricsStart = Date.now();

      lyrics = await callDeepSeek(
        buildSongLyricsPrompt(songConfig, trackNumber, concept, config),
        { temperature: 0.85, maxTokens: 1500 }
      );
      stylePrompt = buildSongStylePrompt(songConfig, config, concept);

      await logGeneration({
        projectId, trackNumber, event: 'lyrics_done',
        durationMs: Date.now() - lyricsStart, model: 'deepseek-chat',
      });

      await db.from('tracks').update({
        lyrics,
        style_prompt: stylePrompt,
        status: 'lyrics_complete',
        updated_at: new Date().toISOString(),
      }).eq('project_id', projectId).eq('track_number', trackNumber);

      console.log(`[api/generate-song] Track ${trackNumber}: lyrics done (${lyrics.length} chars)`);
    }

    if (!stylePrompt) {
      stylePrompt = buildSongStylePrompt(songConfig, config, concept);
    }

    // Submit to KIE with webhook — returns immediately
    console.log(`[api/generate-song] Track ${trackNumber}: submitting to KIE (webhook mode)...`);
    await logGeneration({ projectId, trackNumber, event: 'audio_started', stylePrompt, model: 'kie-suno' });

    const taskId = await submitKieWithWebhook(
      lyrics,
      stylePrompt,
      songConfig.label,
      projectId,
      trackNumber
    );

    // Update track status + save taskId
    await db.from('tracks').update({
      suno_task_id: taskId,
      status: 'generating_audio',
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', trackNumber);

    // Done! Webhook will handle completion, cover backfill, and finalization.
    console.log(`[api/generate-song] Track ${trackNumber}: submitted (taskId=${taskId}). Webhook will complete.`);
    return NextResponse.json({ success: true, taskId });
  } catch (err) {
    console.error('[api/generate-song] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
