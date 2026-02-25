/**
 * V4: Parallel generation + freemium model.
 *
 * Pipeline (orchestrator in /api/generate-track):
 * 1. Enrich idea via DeepSeek -> ShowConcept -> save backstory
 * 2. Create 6 track placeholders
 * 3. Generate lyrics for track 1 + immediately submit to KIE (webhook mode)
 * 4. Track 1 goes straight to generating_audio — no frontend round-trip
 * 5. Tracks 2-6 audio triggered by frontend on unlock
 * 6. Fire generatePlaybillAndAlbum via after() (~10s)
 * 7. Return { success: true }
 *
 * Per-track audio generation handled by /api/generate-song calling generateSingleSong().
 */

import { getServiceSupabase } from './supabase';
import { callDeepSeek, callDeepSeekJSON } from './deepseek';
import { generateTrackViaKie, submitKieWithWebhook } from './suno-kie';
import { logGeneration } from './log-generation';
import { getMusicalTypeConfig, getSongRoles } from './musical-types';
import {
  buildEnrichmentPrompt,
  buildSongLyricsPrompt,
  buildSongStylePrompt,
  buildPlaybillPrompt,
} from './prompts';
import type { MusicalType, ShowConcept, PlaybillContent } from './types';

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

// ===== Exported helpers for orchestrator =====

/**
 * Enrich a user's idea into a full ShowConcept via DeepSeek.
 * Saves backstory to project and generated_content.
 */
export async function doEnrichment(
  projectId: string,
  idea: string,
  musicalType: MusicalType
): Promise<ShowConcept> {
  const db = getServiceSupabase();
  const config = getMusicalTypeConfig(musicalType);

  await db.from('projects').update({
    status: 'enriching',
    updated_at: new Date().toISOString(),
  }).eq('id', projectId);

  const enrichStart = Date.now();
  await logGeneration({ projectId, event: 'enrichment_started', model: 'deepseek-chat' });

  const concept = await callDeepSeekJSON<ShowConcept>(
    buildEnrichmentPrompt(idea, config)
  );

  await logGeneration({
    projectId, event: 'enrichment_done',
    durationMs: Date.now() - enrichStart, model: 'deepseek-chat',
  });

  console.log('[generate-show] Enrichment done:', concept.title_options[0]?.title);

  // Save backstory (orchestrator sets status separately)
  await db.from('projects').update({
    backstory: JSON.stringify(concept),
    updated_at: new Date().toISOString(),
  }).eq('id', projectId);

  // Save to generated_content for reference
  await db.from('generated_content').insert({
    project_id: projectId,
    content_type: 'lifemap', // reusing the type
    content: concept,
    llm_model: 'deepseek-chat',
  });

  return concept;
}

/**
 * Create 6 track placeholders in the database.
 */
export async function createPlaceholders(
  projectId: string,
  musicalType: MusicalType
): Promise<void> {
  const db = getServiceSupabase();
  const songRoles = getSongRoles(musicalType);

  for (let i = 0; i < 6; i++) {
    await db.from('tracks').insert({
      project_id: projectId,
      track_number: i + 1,
      title: songRoles[i].label,
      narrative_role: 'origin', // legacy field, not used for musicals
      song_role: songRoles[i].role,
      status: 'pending',
    });
  }

  console.log('[generate-show] Created 6 track placeholders');
}

/**
 * Generate lyrics only for a single track (no audio).
 * Sets status to lyrics_complete when done.
 */
export async function generateLyricsOnly(
  projectId: string,
  trackNumber: number,
  concept: ShowConcept,
  musicalType: MusicalType
): Promise<void> {
  const db = getServiceSupabase();
  const config = getMusicalTypeConfig(musicalType);
  const songRoles = getSongRoles(musicalType);
  const songConfig = songRoles[trackNumber - 1];

  try {
    await db.from('tracks').update({
      status: 'generating_lyrics',
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', trackNumber);

    console.log(`[generate-show] Song ${trackNumber} (${songConfig.role}): Generating lyrics...`);
    const lyricsStart = Date.now();
    await logGeneration({ projectId, trackNumber, event: 'lyrics_started', model: 'deepseek-chat' });

    const lyrics = await callDeepSeek(
      buildSongLyricsPrompt(songConfig, trackNumber, concept, config),
      { temperature: 0.85, maxTokens: 1500 }
    );
    const stylePrompt = buildSongStylePrompt(songConfig, config, concept);

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

    console.log(`[generate-show] Song ${trackNumber}: Lyrics complete (${lyrics.length} chars)`);
  } catch (err) {
    console.error(`[generate-show] Song ${trackNumber}: Lyrics generation failed:`, err);
    await logGeneration({
      projectId, trackNumber, event: 'failed',
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    await db.from('tracks').update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', trackNumber);
  }
}

/**
 * Generate lyrics for track 1 AND immediately submit to KIE (webhook mode).
 * Saves ~6-10s vs waiting for the album page to detect lyrics_complete.
 */
export async function generateLyricsAndSubmitAudio(
  projectId: string,
  trackNumber: number,
  concept: ShowConcept,
  musicalType: MusicalType
): Promise<void> {
  const db = getServiceSupabase();
  const config = getMusicalTypeConfig(musicalType);
  const songRoles = getSongRoles(musicalType);
  const songConfig = songRoles[trackNumber - 1];

  try {
    // --- Generate lyrics (same as generateLyricsOnly) ---
    await db.from('tracks').update({
      status: 'generating_lyrics',
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', trackNumber);

    console.log(`[generate-show] Song ${trackNumber} (${songConfig.role}): Generating lyrics...`);
    const lyricsStart = Date.now();
    await logGeneration({ projectId, trackNumber, event: 'lyrics_started', model: 'deepseek-chat' });

    const lyrics = await callDeepSeek(
      buildSongLyricsPrompt(songConfig, trackNumber, concept, config),
      { temperature: 0.85, maxTokens: 1500 }
    );
    const stylePrompt = buildSongStylePrompt(songConfig, config, concept);

    await logGeneration({
      projectId, trackNumber, event: 'lyrics_done',
      durationMs: Date.now() - lyricsStart, model: 'deepseek-chat',
    });

    // Save lyrics with lyrics_complete momentarily
    await db.from('tracks').update({
      lyrics,
      style_prompt: stylePrompt,
      status: 'lyrics_complete',
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', trackNumber);

    console.log(`[generate-show] Song ${trackNumber}: Lyrics complete (${lyrics.length} chars) — submitting to KIE immediately`);

    // --- Submit to KIE right away (no waiting for album page) ---
    await logGeneration({ projectId, trackNumber, event: 'audio_started', stylePrompt, model: 'kie-suno' });

    const taskId = await submitKieWithWebhook(
      lyrics,
      stylePrompt,
      songConfig.label,
      projectId,
      trackNumber
    );

    await db.from('tracks').update({
      suno_task_id: taskId,
      status: 'generating_audio',
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', trackNumber);

    console.log(`[generate-show] Song ${trackNumber}: KIE submitted (taskId=${taskId}). Webhook will complete.`);
  } catch (err) {
    console.error(`[generate-show] Song ${trackNumber}: Lyrics+submit failed:`, err);
    await logGeneration({
      projectId, trackNumber, event: 'failed',
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    await db.from('tracks').update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', trackNumber);
  }
}

/**
 * Generate audio for a single track that already has lyrics.
 * Called by /api/generate-song endpoint. Handles lyrics->audio->complete.
 */
export async function generateSingleSong(
  projectId: string,
  trackNumber: number,
  concept: ShowConcept,
  musicalType: MusicalType
): Promise<void> {
  const db = getServiceSupabase();
  const config = getMusicalTypeConfig(musicalType);
  const songRoles = getSongRoles(musicalType);
  const songConfig = songRoles[trackNumber - 1];

  try {
    // Check if track already has lyrics (lyrics_complete state)
    const { data: track } = await db
      .from('tracks')
      .select('lyrics, style_prompt, status')
      .eq('project_id', projectId)
      .eq('track_number', trackNumber)
      .single();

    let lyrics = track?.lyrics;
    let stylePrompt = track?.style_prompt;

    // If lyrics not yet generated, generate them first
    if (!lyrics) {
      await db.from('tracks').update({
        status: 'generating_lyrics',
        updated_at: new Date().toISOString(),
      }).eq('project_id', projectId).eq('track_number', trackNumber);

      console.log(`[generate-show] Song ${trackNumber} (${songConfig.role}): Generating lyrics...`);
      const lyricsStart = Date.now();
      await logGeneration({ projectId, trackNumber, event: 'lyrics_started', model: 'deepseek-chat' });

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
        status: 'lyrics_done',
        updated_at: new Date().toISOString(),
      }).eq('project_id', projectId).eq('track_number', trackNumber);

      console.log(`[generate-show] Song ${trackNumber}: Lyrics done (${lyrics.length} chars)`);
    }

    if (!stylePrompt) {
      stylePrompt = buildSongStylePrompt(songConfig, config, concept);
    }

    // Generate audio via KIE
    console.log(`[generate-show] Song ${trackNumber}: Generating audio...`);
    const audioStart = Date.now();
    await logGeneration({ projectId, trackNumber, event: 'audio_started', stylePrompt, model: 'kie-suno' });

    await db.from('tracks').update({
      status: 'generating_audio',
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', trackNumber);

    try {
      const result = await generateTrackViaKie(lyrics, stylePrompt, songConfig.label);

      await logGeneration({
        projectId, trackNumber, event: 'audio_done',
        durationMs: Date.now() - audioStart, model: 'kie-suno',
      });

      await db.from('tracks').update({
        suno_task_id: result.id,
        audio_url: result.audio_url,
        cover_image_url: result.image_url,
        duration: result.duration,
        status: 'complete',
        updated_at: new Date().toISOString(),
      }).eq('project_id', projectId).eq('track_number', trackNumber);

      console.log(`[generate-show] Song ${trackNumber}: Complete (${result.duration}s)`);
    } catch (audioErr) {
      console.error(`[generate-show] Song ${trackNumber}: Audio failed, retrying simpler...`);
      try {
        const simpleStyle = config.style_overview.split(',')[0] || 'broadway';
        const retryResult = await generateTrackViaKie(lyrics, simpleStyle, songConfig.label);

        await db.from('tracks').update({
          suno_task_id: retryResult.id,
          audio_url: retryResult.audio_url,
          cover_image_url: retryResult.image_url,
          duration: retryResult.duration,
          status: 'complete',
          retry_count: 1,
          updated_at: new Date().toISOString(),
        }).eq('project_id', projectId).eq('track_number', trackNumber);

        console.log(`[generate-show] Song ${trackNumber}: Retry succeeded`);
      } catch (retryErr) {
        console.error(`[generate-show] Song ${trackNumber}: Retry also failed:`, retryErr);
        await db.from('tracks').update({
          status: 'failed',
          retry_count: 1,
          updated_at: new Date().toISOString(),
        }).eq('project_id', projectId).eq('track_number', trackNumber);
      }
    }
  } catch (err) {
    console.error(`[generate-show] Song ${trackNumber}: Fatal error:`, err);
    await logGeneration({
      projectId, trackNumber, event: 'failed',
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    await db.from('tracks').update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', trackNumber);
  }
}

export async function generatePlaybillAndAlbum(
  projectId: string,
  concept: ShowConcept,
  musicalType: MusicalType
): Promise<string> {
  const db = getServiceSupabase();
  const config = getMusicalTypeConfig(musicalType);

  try {
    console.log('[generate-show] Generating playbill...');
    const playbillStart = Date.now();

    const playbill = await callDeepSeekJSON<PlaybillContent>(
      buildPlaybillPrompt(concept, config)
    );

    await logGeneration({
      projectId, event: 'playbill_done',
      durationMs: Date.now() - playbillStart, model: 'deepseek-chat',
    });

    console.log('[generate-show] Playbill generated');

    // Get title from concept
    const recommended = concept.recommended_title ?? 0;
    const albumTitle = concept.title_options[recommended]?.title ?? 'Untitled';
    const albumTagline = concept.title_options[recommended]?.tagline ?? '';

    // Check for a cover image from first completed track
    const { data: firstTrack } = await db
      .from('tracks')
      .select('cover_image_url')
      .eq('project_id', projectId)
      .eq('status', 'complete')
      .order('track_number')
      .limit(1)
      .single();

    const shareSlug = generateSlug();

    await db.from('albums').insert({
      project_id: projectId,
      title: albumTitle,
      tagline: albumTagline,
      biography_markdown: null,
      playbill_content: playbill,
      share_slug: shareSlug,
      cover_image_url: firstTrack?.cover_image_url || null,
      title_alternatives: concept.title_options,
    });

    console.log('[generate-show] Album created with slug:', shareSlug);
    return shareSlug;
  } catch (err) {
    console.error('[generate-show] Playbill/album creation failed:', err);
    const shareSlug = generateSlug();
    const recommended = concept.recommended_title ?? 0;
    await db.from('albums').insert({
      project_id: projectId,
      title: concept.title_options[recommended]?.title ?? 'Untitled',
      tagline: concept.title_options[recommended]?.tagline ?? '',
      share_slug: shareSlug,
      title_alternatives: concept.title_options,
    });
    return shareSlug;
  }
}

export async function maybeFinalizeProject(projectId: string): Promise<void> {
  const db = getServiceSupabase();

  const { data: tracks } = await db
    .from('tracks')
    .select('status, cover_image_url')
    .eq('project_id', projectId);

  const allTerminal = tracks?.length === 6 &&
    tracks.every((t: { status: string }) => t.status === 'complete' || t.status === 'failed');

  const { data: album } = await db
    .from('albums')
    .select('id, cover_image_url')
    .eq('project_id', projectId)
    .single();

  // Backfill album cover if missing
  if (album && !album.cover_image_url) {
    const coverTrack = tracks?.find((t: { cover_image_url: string | null }) => t.cover_image_url);
    if (coverTrack) {
      await db.from('albums').update({ cover_image_url: coverTrack.cover_image_url }).eq('id', album.id);
    }
  }

  if (!allTerminal || !album) return;

  await db.from('projects').update({
    status: 'complete',
    updated_at: new Date().toISOString(),
  }).eq('id', projectId);

  console.log(`[generate-show] All 6 songs terminal + album exists — project ${projectId} finalized`);
}

/**
 * Legacy orchestrator — kept for reference but no longer called.
 * New flow uses /api/generate-track (orchestrator) + /api/generate-song (per-track worker).
 */
export async function generateShow(projectId: string): Promise<void> {
  const db = getServiceSupabase();

  try {
    const { data: project } = await db
      .from('projects')
      .select('id, musical_type, idea')
      .eq('id', projectId)
      .single();

    if (!project?.musical_type || !project?.idea) {
      console.error('[generate-show] Missing musical_type or idea');
      await db.from('projects').update({ status: 'failed' }).eq('id', projectId);
      return;
    }

    const musicalType = project.musical_type as MusicalType;
    const concept = await doEnrichment(projectId, project.idea, musicalType);
    await createPlaceholders(projectId, musicalType);

    // Generate all lyrics in parallel
    await Promise.allSettled(
      [1, 2, 3, 4, 5, 6].map(n => generateLyricsOnly(projectId, n, concept, musicalType))
    );

    // Generate all audio in parallel
    await Promise.allSettled(
      [1, 2, 3, 4, 5, 6].map(n => generateSingleSong(projectId, n, concept, musicalType))
    );

    await generatePlaybillAndAlbum(projectId, concept, musicalType);
    await maybeFinalizeProject(projectId);
  } catch (err) {
    console.error('[generate-show] Fatal error:', err);
    await logGeneration({
      projectId, event: 'show_fatal_error',
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    await db.from('projects').update({ status: 'failed' }).eq('id', projectId);
  }
}
