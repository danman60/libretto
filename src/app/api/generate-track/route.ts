import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generateTrack } from '@/lib/suno';
import type { MusicPreferences } from '@/lib/types';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const { projectId, trackId } = await request.json();
    if (!projectId || !trackId) {
      return NextResponse.json({ error: 'Missing projectId or trackId' }, { status: 400 });
    }

    const db = getServiceSupabase();

    // Verify project is in generating_music status
    const { data: project } = await db
      .from('projects')
      .select('id, status')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.status !== 'generating_music') {
      return NextResponse.json({ error: 'Project not in generating_music status' }, { status: 409 });
    }

    // Verify track belongs to project and has lyrics but no audio
    const { data: track } = await db
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .eq('project_id', projectId)
      .single();

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (!track.lyrics) {
      return NextResponse.json({ error: 'Track has no lyrics' }, { status: 400 });
    }

    if (track.audio_url) {
      return NextResponse.json({ error: 'Track already has audio' }, { status: 409 });
    }

    // Get music preferences for vocal_mode and genres (needed for retry)
    const { data: prefs } = await db
      .from('music_preferences')
      .select('*')
      .eq('project_id', projectId)
      .single();

    const musicPrefs = prefs as MusicPreferences | null;

    // Set track to generating_audio
    await db
      .from('tracks')
      .update({ status: 'generating_audio', updated_at: new Date().toISOString() })
      .eq('id', trackId);

    try {
      const isInstrumental = musicPrefs?.vocal_mode === 'instrumental';
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
        .eq('id', trackId);
    } catch (err) {
      console.error(`Music generation failed for track ${track.track_number}:`, err);

      // Retry once with simplified style
      if (track.retry_count === 0) {
        try {
          await db.from('tracks').update({ retry_count: 1 }).eq('id', trackId);
          const simpleStyle = musicPrefs?.genres?.[0] || 'pop';
          const retryResult = await generateTrack(
            track.lyrics || '',
            simpleStyle,
            track.title,
            musicPrefs?.vocal_mode === 'instrumental'
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
            .eq('id', trackId);
        } catch {
          await db
            .from('tracks')
            .update({ status: 'failed', updated_at: new Date().toISOString() })
            .eq('id', trackId);
        }
      } else {
        await db
          .from('tracks')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', trackId);
      }
    }

    // Check if ALL tracks are now complete or failed — finalize if so
    const { data: allTracks } = await db
      .from('tracks')
      .select('status, cover_image_url, track_number')
      .eq('project_id', projectId)
      .order('track_number');

    if (allTracks) {
      const allDone = allTracks.every(
        (t: { status: string }) => t.status === 'complete' || t.status === 'failed'
      );

      if (allDone) {
        // Set album cover from first completed track
        const firstComplete = allTracks.find(
          (t: { status: string; cover_image_url: string | null }) =>
            t.status === 'complete' && t.cover_image_url
        );
        if (firstComplete) {
          await db
            .from('albums')
            .update({ cover_image_url: firstComplete.cover_image_url })
            .eq('project_id', projectId);
        }

        await db
          .from('projects')
          .update({ status: 'complete', updated_at: new Date().toISOString() })
          .eq('id', projectId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Generate track error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
