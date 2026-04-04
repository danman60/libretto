/**
 * Album generation pipeline.
 * Extracted from the API route so it can run as a background process.
 * Each step updates Supabase so the client can poll for progress.
 */

import { getServiceSupabase } from './supabase';
import { callDeepSeek, callDeepSeekJSON } from './deepseek';
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

  try {
    // Fetch all intake data
    const { data: intakeRows } = await db
      .from('story_intake')
      .select('*')
      .eq('project_id', projectId);

    const { data: prefs } = await db
      .from('music_preferences')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (!intakeRows?.length || !prefs) {
      await db.from('projects').update({ status: 'failed' }).eq('id', projectId);
      return;
    }

    const turningPointsRow = intakeRows.find((r: { step: string }) => r.step === 'turning_points');
    const innerWorldRow = intakeRows.find((r: { step: string }) => r.step === 'inner_world');
    const scenesRow = intakeRows.find((r: { step: string }) => r.step === 'scenes');

    if (!turningPointsRow || !innerWorldRow || !scenesRow) {
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

    // ===== STEP 1: Generate LifeMap =====
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
    } catch (err) {
      console.error('LifeMap generation failed:', err);
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
    let biography: string;
    try {
      biography = await callDeepSeek(
        buildBiographyPrompt(lifeMap, sanitized.turningPoints, sanitized.innerWorld),
        { temperature: 0.7, maxTokens: 3000 }
      );
    } catch (err) {
      console.error('Biography generation failed:', err);
      biography = 'Biography generation failed. Your story is still preserved in the tracks below.';
    }

    await db.from('generated_content').insert({
      project_id: projectId,
      content_type: 'biography',
      content: { markdown: biography },
      llm_model: 'deepseek-chat',
    });

    // ===== STEP 3: Generate Album Title =====
    let albumTitle = 'Untitled Album';
    let albumTagline = '';
    try {
      const titleResult = await callDeepSeekJSON<{ title: string; tagline: string }>(
        buildAlbumTitlePrompt(lifeMap)
      );
      albumTitle = titleResult.title;
      albumTagline = titleResult.tagline;
    } catch (err) {
      console.error('Album title generation failed:', err);
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

    // ===== STEP 5: Generate Lyrics =====
    const musicPrefs = prefs as MusicPreferences;

    for (let i = 0; i < 5; i++) {
      const trackNum = i + 1;
      const role = NARRATIVE_ROLES[i];

      await db
        .from('tracks')
        .update({ status: 'generating_lyrics', updated_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('track_number', trackNum);

      try {
        const lyrics = await callDeepSeek(
          buildLyricsPrompt(trackNum, role, lifeMap, musicPrefs),
          { temperature: 0.85, maxTokens: 1500 }
        );

        const stylePrompt = buildStylePrompt(role, lifeMap, musicPrefs);

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
      } catch (err) {
        console.error(`Lyrics generation failed for track ${trackNum}:`, err);
        await db
          .from('tracks')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('project_id', projectId)
          .eq('track_number', trackNum);
      }
    }

    // ===== STEP 6: Set status to generating_music =====
    // Music generation is now handled per-track by /api/generate-track,
    // driven by the client polling loop. This avoids Vercel timeout limits.
    await db.from('projects').update({ status: 'generating_music', updated_at: new Date().toISOString() }).eq('id', projectId);
  } catch (err) {
    console.error('Pipeline error:', err);
    const db = getServiceSupabase();
    await db.from('projects').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', projectId);
  }
}
