/**
 * V2: Generate a single track from one moment.
 * Uses music_profile from project (set in step 0) + track character per narrative role.
 * ~75s total (lyrics ~10s + audio ~65s), fits in one Vercel function.
 */

import { getServiceSupabase } from './supabase';
import { callDeepSeek } from './deepseek';
import { generateTrackViaKie } from './suno-kie';
import { sanitizeText } from './sanitize';
import { buildMomentLyricsPrompt, buildMomentStylePrompt } from './prompts';
import { logGeneration } from './log-generation';
import type { Emotion, MusicProfile, NarrativeRole } from './types';

const ROLE_MAP: Record<number, NarrativeRole> = {
  1: 'origin',
  2: 'turning_point',
  3: 'resolution',
};

const ROLE_TITLES: Record<NarrativeRole, string> = {
  origin: 'Where It All Began',
  turning_point: 'The Shift',
  resolution: 'Where I Stand',
};

/**
 * Check if all 3 tracks are terminal (complete/failed) and album exists.
 * If so, finalize project status to 'complete'.
 */
async function maybeFinalizeProject(projectId: string): Promise<void> {
  const db = getServiceSupabase();

  const { data: tracks } = await db
    .from('tracks')
    .select('status, cover_image_url')
    .eq('project_id', projectId);

  const allTerminal = tracks?.length === 3 &&
    tracks.every((t: { status: string }) => t.status === 'complete' || t.status === 'failed');

  const { data: album } = await db
    .from('albums')
    .select('id, cover_image_url')
    .eq('project_id', projectId)
    .single();

  // Backfill album cover if missing but a track has one
  if (album && !album.cover_image_url) {
    const coverTrack = tracks?.find((t: { cover_image_url: string | null }) => t.cover_image_url);
    if (coverTrack) {
      await db.from('albums').update({
        cover_image_url: coverTrack.cover_image_url,
      }).eq('id', album.id);
      console.log(`[generate-track] Backfilled album cover from track`);
    }
  }

  if (!allTerminal || !album) return;

  await db.from('projects').update({
    status: 'complete',
    updated_at: new Date().toISOString(),
  }).eq('id', projectId);

  console.log(`[generate-track] All tracks terminal + album exists — project ${projectId} finalized`);
}

export async function generateTrackFromMoment(
  projectId: string,
  momentIndex: number,
  story: string,
  emotion: Emotion,
  allowNames: boolean
): Promise<void> {
  const db = getServiceSupabase();
  const role = ROLE_MAP[momentIndex];
  const trackNum = momentIndex;

  // Load music profile from project (set in step 0)
  const { data: project } = await db
    .from('projects')
    .select('music_profile')
    .eq('id', projectId)
    .single();

  const musicProfile: MusicProfile | null = project?.music_profile || null;
  console.log(`[generate-track] Track ${trackNum} (${role}): profile=${JSON.stringify(musicProfile)}`);

  try {
    const sanitizedStory = sanitizeText(story, allowNames);

    // Update project status
    await db.from('projects').update({
      status: 'moments_in_progress',
      updated_at: new Date().toISOString(),
    }).eq('id', projectId);

    // Create/update track placeholder
    const { data: existingTrack } = await db
      .from('tracks')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('track_number', trackNum)
      .single();

    if (existingTrack?.status === 'complete') {
      console.log(`[generate-track] Track ${trackNum} already complete, skipping`);
      return;
    }

    if (!existingTrack) {
      await db.from('tracks').insert({
        project_id: projectId,
        track_number: trackNum,
        moment_index: momentIndex,
        title: ROLE_TITLES[role],
        narrative_role: role,
        status: 'generating_lyrics',
      });
    } else {
      await db.from('tracks').update({
        status: 'generating_lyrics',
        updated_at: new Date().toISOString(),
      }).eq('id', existingTrack.id);
    }

    // Generate lyrics via DeepSeek (~10s)
    console.log(`[generate-track] Track ${trackNum}: Generating lyrics...`);
    const lyricsStart = Date.now();
    await logGeneration({ projectId, trackNumber: trackNum, event: 'lyrics_started', model: 'deepseek-chat' });

    const lyricsPrompt = buildMomentLyricsPrompt(
      trackNum, role, sanitizedStory, emotion, musicProfile, allowNames
    );
    const lyrics = await callDeepSeek(lyricsPrompt, { temperature: 0.85, maxTokens: 1500 });
    const stylePrompt = buildMomentStylePrompt(role, emotion, musicProfile);

    await logGeneration({
      projectId, trackNumber: trackNum, event: 'lyrics_done',
      durationMs: Date.now() - lyricsStart, model: 'deepseek-chat',
    });

    await db.from('tracks').update({
      lyrics,
      style_prompt: stylePrompt,
      status: 'lyrics_done',
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', trackNum);

    console.log(`[generate-track] Track ${trackNum}: Lyrics done (${lyrics.length} chars)`);
    console.log(`[generate-track] Track ${trackNum}: Style prompt: ${stylePrompt}`);

    // Generate audio via KIE (~65s)
    console.log(`[generate-track] Track ${trackNum}: Generating audio...`);
    const audioStart = Date.now();
    await logGeneration({ projectId, trackNumber: trackNum, event: 'audio_started', stylePrompt, model: 'kie-suno' });

    await db.from('tracks').update({
      status: 'generating_audio',
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', trackNum);

    try {
      const result = await generateTrackViaKie(lyrics, stylePrompt, ROLE_TITLES[role]);

      await logGeneration({
        projectId, trackNumber: trackNum, event: 'audio_done',
        durationMs: Date.now() - audioStart, stylePrompt, model: 'kie-suno',
      });

      await db.from('tracks').update({
        suno_task_id: result.id,
        audio_url: result.audio_url,
        cover_image_url: result.image_url,
        duration: result.duration,
        status: 'complete',
        updated_at: new Date().toISOString(),
      }).eq('project_id', projectId).eq('track_number', trackNum);

      console.log(`[generate-track] Track ${trackNum}: Complete (${result.duration}s)`);
      await maybeFinalizeProject(projectId);
    } catch (audioErr) {
      console.error(`[generate-track] Track ${trackNum}: Audio failed, retrying with simpler style...`);
      await logGeneration({
        projectId, trackNumber: trackNum, event: 'audio_retry',
        durationMs: Date.now() - audioStart, stylePrompt, model: 'kie-suno',
        errorMessage: audioErr instanceof Error ? audioErr.message : String(audioErr),
      });

      // Retry with simpler style
      const retryStart = Date.now();
      try {
        const simpleStyle = musicProfile?.genres?.[0] || 'pop';
        const retryResult = await generateTrackViaKie(lyrics, simpleStyle, ROLE_TITLES[role]);

        await logGeneration({
          projectId, trackNumber: trackNum, event: 'audio_done',
          durationMs: Date.now() - retryStart, stylePrompt: simpleStyle, model: 'kie-suno',
        });

        await db.from('tracks').update({
          suno_task_id: retryResult.id,
          audio_url: retryResult.audio_url,
          cover_image_url: retryResult.image_url,
          duration: retryResult.duration,
          status: 'complete',
          retry_count: 1,
          updated_at: new Date().toISOString(),
        }).eq('project_id', projectId).eq('track_number', trackNum);

        console.log(`[generate-track] Track ${trackNum}: Retry succeeded`);
        await maybeFinalizeProject(projectId);
      } catch (retryErr) {
        console.error(`[generate-track] Track ${trackNum}: Retry also failed:`, retryErr);
        await logGeneration({
          projectId, trackNumber: trackNum, event: 'failed',
          durationMs: Date.now() - retryStart, model: 'kie-suno',
          errorMessage: retryErr instanceof Error ? retryErr.message : String(retryErr),
        });
        await db.from('tracks').update({
          status: 'failed',
          retry_count: 1,
          updated_at: new Date().toISOString(),
        }).eq('project_id', projectId).eq('track_number', trackNum);
        await maybeFinalizeProject(projectId);
      }
    }
  } catch (err) {
    console.error(`[generate-track] Track ${trackNum}: Fatal error:`, err);
    await logGeneration({
      projectId, trackNumber: trackNum, event: 'failed',
      model: 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    await db.from('tracks').update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', trackNum);
  }
}
