/**
 * Album generation pipeline.
 * Extracted from the API route so it can run as a background process.
 * Each step updates Supabase so the client can poll for progress.
 *
 * INTERLEAVED: For each track, generates lyrics then audio before moving to next track.
 * First track audio ready in ~80s instead of ~300s.
 */

import { getServiceSupabase } from './supabase';
import { callDeepSeek, callDeepSeekJSON } from './deepseek';
import { generateTrackViaKie } from './suno-kie';
import { sanitizeStoryInput } from './sanitize';
import {
  buildLifeMapPrompt,
  buildBiographyPrompt,
  buildAlbumTitlePrompt,
  buildLyricsPrompt,
  buildStylePrompt,
} from './prompts';
import type {
  LifeMap,
  NarrativeRole,
  TurningPointsContent,
  InnerWorldContent,
  ScenesContent,
  MusicPreferences,
} from './types';

const NARRATIVE_ROLES: NarrativeRole[] = [
  'origin',
  'disruption',
  'reflection',
  'turning_point',
  'resolution',
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

export async function runPipeline(projectId: string): Promise<void> {
  const db = getServiceSupabase();
  console.log(`[pipeline] Starting for project ${projectId}`);

  try {
    // Fetch all intake data
    console.log('[pipeline] Fetching intake data...');
    const { data: intakeRows, error: intakeError } = await db
      .from('story_intake')
      .select('*')
      .eq('project_id', projectId);

    const { data: prefs, error: prefsError } = await db
      .from('music_preferences')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (intakeError) console.error('[pipeline] Intake fetch error:', intakeError);
    if (prefsError) console.error('[pipeline] Prefs fetch error:', prefsError);

    if (!intakeRows?.length || !prefs) {
      console.error('[pipeline] Missing intake data or preferences, marking failed');
      await db.from('projects').update({ status: 'failed' }).eq('id', projectId);
      return;
    }

    console.log(`[pipeline] Got ${intakeRows.length} intake rows and preferences`);

    const turningPointsRow = intakeRows.find((r: { step: string }) => r.step === 'turning_points');
    const innerWorldRow = intakeRows.find((r: { step: string }) => r.step === 'inner_world');
    const scenesRow = intakeRows.find((r: { step: string }) => r.step === 'scenes');

    if (!turningPointsRow || !innerWorldRow || !scenesRow) {
      console.error('[pipeline] Missing required intake steps');
      await db.from('projects').update({ status: 'failed' }).eq('id', projectId);
      return;
    }

    const turningPointsContent = turningPointsRow.content as TurningPointsContent;
    const innerWorldContent = innerWorldRow.content as InnerWorldContent;
    const scenesContent = scenesRow.content as ScenesContent;

    const sanitized = sanitizeStoryInput(
      turningPointsContent.text,
      innerWorldContent.text,
      scenesContent.scenes,
      prefs.allow_real_names
    );

    // Update status to processing
    await db.from('projects').update({ status: 'processing', updated_at: new Date().toISOString() }).eq('id', projectId);
    console.log('[pipeline] Status -> processing');

    // ===== STEP 1: Generate LifeMap =====
    console.log('[pipeline] Step 1: Generating LifeMap...');
    const lifeMapPrompt = buildLifeMapPrompt(
      sanitized.turningPoints,
      sanitized.innerWorld,
      sanitized.scenes.map((s: { location: string; who_was_present: string; what_changed: string }, i: number) => ({
        ...s,
        dominant_emotion: scenesContent.scenes[i]?.dominant_emotion,
      }))
    );

    let lifeMap: LifeMap;
    try {
      lifeMap = await callDeepSeekJSON<LifeMap>(lifeMapPrompt);
      console.log('[pipeline] LifeMap generated:', lifeMap.themes?.length, 'themes,', lifeMap.chapters?.length, 'chapters');
    } catch (err) {
      console.error('[pipeline] LifeMap generation failed:', err);
      await db.from('projects').update({ status: 'failed' }).eq('id', projectId);
      return;
    }

    await db.from('generated_content').insert({
      project_id: projectId,
      content_type: 'lifemap',
      content: lifeMap,
      llm_model: 'deepseek-chat',
    });

    // ===== STEP 2: Generate Biography =====
    console.log('[pipeline] Step 2: Generating biography...');
    let biography: string;
    try {
      biography = await callDeepSeek(
        buildBiographyPrompt(lifeMap, sanitized.turningPoints, sanitized.innerWorld),
        { temperature: 0.7, maxTokens: 3000 }
      );
      console.log('[pipeline] Biography generated:', biography.length, 'chars');
    } catch (err) {
      console.error('[pipeline] Biography generation failed:', err);
      biography = 'Biography generation failed. Your story is still preserved in the tracks below.';
    }

    await db.from('generated_content').insert({
      project_id: projectId,
      content_type: 'biography',
      content: { markdown: biography },
      llm_model: 'deepseek-chat',
    });

    // ===== STEP 3: Generate Album Title =====
    console.log('[pipeline] Step 3: Generating title...');
    let albumTitle = 'Untitled';
    let albumTagline = '';
    try {
      const titleResult = await callDeepSeekJSON<{ title: string; tagline: string }>(
        buildAlbumTitlePrompt(lifeMap)
      );
      albumTitle = titleResult.title;
      albumTagline = titleResult.tagline;
      console.log('[pipeline] Title:', albumTitle, '| Tagline:', albumTagline);
    } catch (err) {
      console.error('[pipeline] Title generation failed:', err);
      albumTitle = lifeMap.themes[0] || 'My Story';
    }

    const shareSlug = generateSlug();
    await db.from('albums').insert({
      project_id: projectId,
      title: albumTitle,
      tagline: albumTagline,
      biography_markdown: biography,
      share_slug: shareSlug,
    });
    console.log('[pipeline] Album created with slug:', shareSlug);

    // ===== STEP 4: Create track placeholders =====
    const trackTitles = lifeMap.chapters.slice(0, 5).map((c) => c.title);
    while (trackTitles.length < 5) {
      trackTitles.push(`Track ${trackTitles.length + 1}`);
    }

    for (let i = 0; i < 5; i++) {
      await db.from('tracks').insert({
        project_id: projectId,
        track_number: i + 1,
        title: trackTitles[i],
        narrative_role: NARRATIVE_ROLES[i],
        status: 'pending',
      });
    }
    console.log('[pipeline] 5 track placeholders created');

    // ===== STEP 5: INTERLEAVED Lyrics + Music Generation =====
    // For each track: generate lyrics -> generate audio -> next track
    // First track audio ready in ~80s instead of waiting for all lyrics first
    const musicPrefs = prefs as MusicPreferences;

    for (let i = 0; i < 5; i++) {
      const trackNum = i + 1;
      const role = NARRATIVE_ROLES[i];
      console.log(`[pipeline] Track ${trackNum}: Starting lyrics generation...`);

      // --- Generate Lyrics ---
      await db
        .from('tracks')
        .update({ status: 'generating_lyrics', updated_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('track_number', trackNum);

      let lyrics: string | null = null;
      let stylePrompt: string | null = null;

      try {
        lyrics = await callDeepSeek(
          buildLyricsPrompt(trackNum, role, lifeMap, musicPrefs),
          { temperature: 0.85, maxTokens: 1500 }
        );
        stylePrompt = buildStylePrompt(role, lifeMap, musicPrefs);

        await db
          .from('tracks')
          .update({
            lyrics,
            style_prompt: stylePrompt,
            status: 'lyrics_done',
            updated_at: new Date().toISOString(),
          })
          .eq('project_id', projectId)
          .eq('track_number', trackNum);

        console.log(`[pipeline] Track ${trackNum}: Lyrics done (${lyrics.length} chars)`);
      } catch (err) {
        console.error(`[pipeline] Track ${trackNum}: Lyrics generation failed:`, err);
        await db
          .from('tracks')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('project_id', projectId)
          .eq('track_number', trackNum);
        continue; // Skip to next track
      }

      // --- Generate Audio ---
      console.log(`[pipeline] Track ${trackNum}: Starting audio generation...`);
      await db
        .from('tracks')
        .update({ status: 'generating_audio', updated_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('track_number', trackNum);

      // Update project status to generating_music once first track enters audio phase
      if (i === 0) {
        await db.from('projects').update({ status: 'generating_music', updated_at: new Date().toISOString() }).eq('id', projectId);
      }

      try {
        const isInstrumental = musicPrefs.vocal_mode === 'instrumental';
        const result = await generateTrackViaKie(
          lyrics,
          stylePrompt!,
          trackTitles[i],
          isInstrumental
        );

        await db
          .from('tracks')
          .update({
            suno_task_id: result.id,
            audio_url: result.audio_url,
            cover_image_url: result.image_url,
            duration: result.duration,
            status: 'complete',
            updated_at: new Date().toISOString(),
          })
          .eq('project_id', projectId)
          .eq('track_number', trackNum);

        console.log(`[pipeline] Track ${trackNum}: Audio complete (${result.duration}s)`);
      } catch (err) {
        console.error(`[pipeline] Track ${trackNum}: Audio generation failed:`, err);

        // Retry once with simpler style
        try {
          console.log(`[pipeline] Track ${trackNum}: Retrying with simple style...`);
          await db.from('tracks').update({ retry_count: 1 }).eq('project_id', projectId).eq('track_number', trackNum);
          const simpleStyle = musicPrefs.genres[0] || 'pop';
          const retryResult = await generateTrackViaKie(
            lyrics,
            simpleStyle,
            trackTitles[i],
            musicPrefs.vocal_mode === 'instrumental'
          );
          await db
            .from('tracks')
            .update({
              suno_task_id: retryResult.id,
              audio_url: retryResult.audio_url,
              cover_image_url: retryResult.image_url,
              duration: retryResult.duration,
              status: 'complete',
              updated_at: new Date().toISOString(),
            })
            .eq('project_id', projectId)
            .eq('track_number', trackNum);

          console.log(`[pipeline] Track ${trackNum}: Retry succeeded`);
        } catch (retryErr) {
          console.error(`[pipeline] Track ${trackNum}: Retry also failed:`, retryErr);
          await db
            .from('tracks')
            .update({ status: 'failed', updated_at: new Date().toISOString() })
            .eq('project_id', projectId)
            .eq('track_number', trackNum);
        }
      }

      // Courtesy delay between tracks (skip after last)
      if (i < 4) {
        console.log(`[pipeline] Waiting 5s before next track...`);
        await sleep(5_000);
      }
    }

    // ===== STEP 6: Finalization =====
    console.log('[pipeline] Finalizing...');
    const { data: completedTracks } = await db
      .from('tracks')
      .select('cover_image_url')
      .eq('project_id', projectId)
      .eq('status', 'complete')
      .order('track_number')
      .limit(1);

    if (completedTracks?.length) {
      await db
        .from('albums')
        .update({ cover_image_url: completedTracks[0].cover_image_url })
        .eq('project_id', projectId);
    }

    await db.from('projects').update({ status: 'complete', updated_at: new Date().toISOString() }).eq('id', projectId);
    console.log(`[pipeline] Complete! Project ${projectId} finished successfully.`);
  } catch (err) {
    console.error('[pipeline] Fatal pipeline error:', err);
    const db = getServiceSupabase();
    await db.from('projects').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', projectId);
  }
}
