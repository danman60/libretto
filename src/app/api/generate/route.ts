import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { callDeepSeek, callDeepSeekJSON } from '@/lib/deepseek';
import { generateTrack, getDelayBetweenTracks } from '@/lib/suno';
import { sanitizeStoryInput } from '@/lib/sanitize';
import {
  buildLifeMapPrompt,
  buildBiographyPrompt,
  buildAlbumTitlePrompt,
  buildLyricsPrompt,
  buildStylePrompt,
} from '@/lib/prompts';
import type {
  LifeMap,
  NarrativeRole,
  TurningPointsContent,
  InnerWorldContent,
  ScenesContent,
  MusicPreferences,
} from '@/lib/types';

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

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const db = getServiceSupabase();

    // Verify project exists
    const { data: project } = await db
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

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
      return NextResponse.json({ error: 'Incomplete intake data' }, { status: 400 });
    }

    // Extract intake content
    const turningPointsRow = intakeRows.find((r) => r.step === 'turning_points');
    const innerWorldRow = intakeRows.find((r) => r.step === 'inner_world');
    const scenesRow = intakeRows.find((r) => r.step === 'scenes');

    if (!turningPointsRow || !innerWorldRow || !scenesRow) {
      return NextResponse.json({ error: 'Missing intake steps' }, { status: 400 });
    }

    const turningPointsContent = turningPointsRow.content as TurningPointsContent;
    const innerWorldContent = innerWorldRow.content as InnerWorldContent;
    const scenesContent = scenesRow.content as ScenesContent;

    // Sanitize
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
      sanitized.scenes.map((s, i) => ({
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
      return NextResponse.json({ error: 'Failed to generate LifeMap' }, { status: 500 });
    }

    // Save LifeMap
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

    // Save biography
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
      // Use fallback from themes
      albumTitle = lifeMap.themes[0] || 'My Story';
    }

    // Create album record
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
    // Pad with generic titles if fewer than 5 chapters
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

    // ===== STEP 5: Generate Lyrics (sequentially) =====
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

    // ===== STEP 6: Generate Music (sequentially with delays) =====
    await db.from('projects').update({ status: 'generating_music', updated_at: new Date().toISOString() }).eq('id', projectId);

    const { data: tracks } = await db
      .from('tracks')
      .select('*')
      .eq('project_id', projectId)
      .order('track_number');

    if (tracks) {
      for (const track of tracks) {
        if (track.status === 'failed' || !track.lyrics) continue;

        await db
          .from('tracks')
          .update({ status: 'generating_audio', updated_at: new Date().toISOString() })
          .eq('id', track.id);

        try {
          const isInstrumental = musicPrefs.vocal_mode === 'instrumental';
          const result = await generateTrack(
            track.lyrics || '',
            track.style_prompt || '',
            track.title,
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
            .eq('id', track.id);
        } catch (err) {
          console.error(`Music generation failed for track ${track.track_number}:`, err);

          // One retry with simplified style
          if (track.retry_count === 0) {
            try {
              await db.from('tracks').update({ retry_count: 1 }).eq('id', track.id);
              const simpleStyle = musicPrefs.genres[0] || 'pop';
              const retryResult = await generateTrack(
                track.lyrics || '',
                simpleStyle,
                track.title,
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
                .eq('id', track.id);
            } catch {
              await db
                .from('tracks')
                .update({ status: 'failed', updated_at: new Date().toISOString() })
                .eq('id', track.id);
            }
          } else {
            await db
              .from('tracks')
              .update({ status: 'failed', updated_at: new Date().toISOString() })
              .eq('id', track.id);
          }
        }

        // Delay between tracks
        await sleep(getDelayBetweenTracks());
      }
    }

    // ===== STEP 7: Finalization =====
    // Pick first completed track's cover as album cover
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

    return NextResponse.json({ success: true, slug: shareSlug });
  } catch (err) {
    console.error('Generate error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
