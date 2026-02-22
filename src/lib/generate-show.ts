/**
 * V3: Generate a full Broadway musical from a type + idea.
 *
 * Pipeline:
 * 1. Enrich idea via DeepSeek → ShowConcept → save backstory
 * 2. Create 6 track placeholders
 * 3. Generate Opening Number first (lyrics → audio, ~65s)
 * 4. Fire remaining 5 songs in parallel (~65s)
 * 5. Generate playbill meta in parallel with songs 2-6
 * Total: ~130s, well within Vercel's 300s limit.
 */

import { getServiceSupabase } from './supabase';
import { callDeepSeek, callDeepSeekJSON } from './deepseek';
import { generateTrackViaKie } from './suno-kie';
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

async function generateSingleSong(
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
    // Update track to generating_lyrics
    await db.from('tracks').update({
      status: 'generating_lyrics',
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', trackNumber);

    // Generate lyrics
    console.log(`[generate-show] Song ${trackNumber} (${songConfig.role}): Generating lyrics...`);
    const lyricsStart = Date.now();
    await logGeneration({ projectId, trackNumber, event: 'lyrics_started', model: 'deepseek-chat' });

    const lyrics = await callDeepSeek(
      buildSongLyricsPrompt(songConfig, trackNumber, concept, config),
      { temperature: 0.85, maxTokens: 1500 }
    );
    const stylePrompt = buildSongStylePrompt(songConfig, config);

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
      // Retry with simpler style
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

async function generatePlaybillAndAlbum(
  projectId: string,
  concept: ShowConcept,
  musicalType: MusicalType
): Promise<void> {
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
      biography_markdown: null, // No biography for musicals — use playbill
      playbill_content: playbill,
      share_slug: shareSlug,
      cover_image_url: firstTrack?.cover_image_url || null,
      title_alternatives: concept.title_options,
    });

    console.log('[generate-show] Album created with slug:', shareSlug);
  } catch (err) {
    console.error('[generate-show] Playbill/album creation failed:', err);
    // Create a minimal album so the user still gets a result
    const shareSlug = generateSlug();
    const recommended = concept.recommended_title ?? 0;
    await db.from('albums').insert({
      project_id: projectId,
      title: concept.title_options[recommended]?.title ?? 'Untitled',
      tagline: concept.title_options[recommended]?.tagline ?? '',
      share_slug: shareSlug,
      title_alternatives: concept.title_options,
    });
  }
}

async function maybeFinalizeProject(projectId: string): Promise<void> {
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
 * Main orchestrator: generate a full Broadway musical.
 */
export async function generateShow(projectId: string): Promise<void> {
  const db = getServiceSupabase();

  try {
    // Load project
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
    const idea = project.idea;
    const config = getMusicalTypeConfig(musicalType);

    // Step 1: Enrich idea → ShowConcept
    console.log('[generate-show] Step 1: Enriching idea...');
    await db.from('projects').update({
      status: 'enriching',
      updated_at: new Date().toISOString(),
    }).eq('id', projectId);

    const enrichStart = Date.now();
    await logGeneration({ projectId, event: 'enrichment_started', model: 'deepseek-chat' });

    let concept: ShowConcept;
    try {
      concept = await callDeepSeekJSON<ShowConcept>(
        buildEnrichmentPrompt(idea, config)
      );
      await logGeneration({
        projectId, event: 'enrichment_done',
        durationMs: Date.now() - enrichStart, model: 'deepseek-chat',
      });
      console.log('[generate-show] Enrichment done:', concept.title_options[0]?.title);
    } catch (err) {
      console.error('[generate-show] Enrichment failed:', err);
      await db.from('projects').update({ status: 'failed' }).eq('id', projectId);
      return;
    }

    // Save backstory
    await db.from('projects').update({
      backstory: JSON.stringify(concept),
      status: 'generating_music',
      updated_at: new Date().toISOString(),
    }).eq('id', projectId);

    // Save to generated_content for reference
    await db.from('generated_content').insert({
      project_id: projectId,
      content_type: 'lifemap', // reusing the type
      content: concept,
      llm_model: 'deepseek-chat',
    });

    // Step 2: Create 6 track placeholders
    console.log('[generate-show] Step 2: Creating 6 track placeholders...');
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

    // Step 3: Generate Opening Number FIRST
    console.log('[generate-show] Step 3: Generating Opening Number...');
    await generateSingleSong(projectId, 1, concept, musicalType);

    // Step 4: Fire remaining 5 songs + playbill in parallel
    console.log('[generate-show] Step 4: Generating songs 2-6 + playbill in parallel...');
    const parallelTasks = [
      generateSingleSong(projectId, 2, concept, musicalType),
      generateSingleSong(projectId, 3, concept, musicalType),
      generateSingleSong(projectId, 4, concept, musicalType),
      generateSingleSong(projectId, 5, concept, musicalType),
      generateSingleSong(projectId, 6, concept, musicalType),
      generatePlaybillAndAlbum(projectId, concept, musicalType),
    ];

    await Promise.allSettled(parallelTasks);

    // Step 5: Finalize
    console.log('[generate-show] Step 5: Finalizing...');
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
