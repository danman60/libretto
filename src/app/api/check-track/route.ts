import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { maybeFinalizeProject } from '@/lib/generate-show';
import { submitKieWithWebhook, getFallbackModel } from '@/lib/suno-kie';
import { logGeneration } from '@/lib/log-generation';

export const maxDuration = 15;

/**
 * POST /api/check-track
 * Polling fallback for unreliable webhooks.
 *
 * Accepts either:
 *   { projectId, trackNumber } — check a single track
 *   { projectId }             — check ALL stale tracks for the project
 *
 * Polls KIE directly. If track completed/failed and webhook missed it,
 * updates DB accordingly. On failure, retries with model fallback chain.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, trackNumber } = body as { projectId: string; trackNumber?: number };

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const db = getServiceSupabase();

    // Determine which tracks to check
    let tracksToCheck: { track_number: number; suno_task_id: string | null; status: string; retry_count: number; lyrics: string | null; style_prompt: string | null; title: string }[];

    if (trackNumber) {
      // Single track mode
      const { data: track } = await db
        .from('tracks')
        .select('track_number, suno_task_id, status, retry_count, lyrics, style_prompt, title')
        .eq('project_id', projectId)
        .eq('track_number', trackNumber)
        .single();

      if (!track) {
        return NextResponse.json({ error: 'Track not found' }, { status: 404 });
      }
      tracksToCheck = [track];
    } else {
      // Project-wide mode: all tracks stuck at generating_audio
      const { data: tracks } = await db
        .from('tracks')
        .select('track_number, suno_task_id, status, retry_count, lyrics, style_prompt, title')
        .eq('project_id', projectId)
        .eq('status', 'generating_audio');

      tracksToCheck = tracks || [];
    }

    const results: { trackNumber: number; status: string }[] = [];

    for (const track of tracksToCheck) {
      if (track.status !== 'generating_audio') {
        results.push({ trackNumber: track.track_number, status: track.status });
        continue;
      }

      if (!track.suno_task_id) {
        results.push({ trackNumber: track.track_number, status: 'no_task_id' });
        continue;
      }

      // Poll KIE directly
      const kieStatus = await pollKieDirect(track.suno_task_id);

      if (kieStatus.status === 'SUCCESS' && kieStatus.sunoData?.length) {
        // Track completed — webhook missed it
        const primary = kieStatus.sunoData[0];
        console.log(`[check-track] Track ${track.track_number} completed (webhook missed): ${primary.audioUrl?.substring(0, 60)}`);

        await logGeneration({
          projectId,
          trackNumber: track.track_number,
          event: 'audio_done_via_poll',
          model: primary.modelName || 'kie-suno',
        });

        const updateData: Record<string, unknown> = {
          suno_id: primary.id,
          audio_url: primary.audioUrl || primary.audio_url,
          cover_image_url: primary.imageUrl || primary.image_url,
          duration: primary.duration,
          suno_model: primary.modelName || primary.model_name || null,
          suno_tags: primary.tags || null,
          suno_created_at: primary.createTime ? new Date(primary.createTime).toISOString() : null,
          status: 'complete',
          updated_at: new Date().toISOString(),
        };

        await db.from('tracks').update(updateData)
          .eq('project_id', projectId).eq('track_number', track.track_number);

        // Backfill album cover
        const coverUrl = primary.imageUrl || primary.image_url;
        if (coverUrl) {
          await db.from('albums')
            .update({ cover_image_url: coverUrl })
            .eq('project_id', projectId)
            .is('cover_image_url', null);
        }

        await maybeFinalizeProject(projectId);
        results.push({ trackNumber: track.track_number, status: 'complete' });

      } else if (kieStatus.status === 'GENERATE_AUDIO_FAILED' || kieStatus.status?.includes('FAILED') || (kieStatus.status === 'SUCCESS' && !kieStatus.sunoData?.length)) {
        // Generation failed — attempt retry with fallback model
        const handled = await handleTrackFailure(db, projectId, track);
        results.push({ trackNumber: track.track_number, status: handled });

      } else {
        // Still pending
        results.push({ trackNumber: track.track_number, status: 'pending' });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error('[check-track] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Direct KIE status check (no polling loop — single request).
 */
async function pollKieDirect(taskId: string): Promise<{ status: string; sunoData?: KieTrackData[] }> {
  try {
    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) throw new Error('KIE_API_KEY not set');

    const response = await fetch(
      `https://api.kie.ai/api/v1/generate/record-info?taskId=${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn(`[check-track] KIE poll failed: ${response.status}`);
      return { status: 'poll_error' };
    }

    const result = await response.json();
    return {
      status: result.data?.status || 'unknown',
      sunoData: result.data?.response?.sunoData || null,
    };
  } catch (err) {
    console.error('[check-track] KIE poll error:', err);
    return { status: 'poll_error' };
  }
}

/**
 * Handle a failed track: retry with fallback model chain or mark as failed.
 */
async function handleTrackFailure(
  db: ReturnType<typeof getServiceSupabase>,
  projectId: string,
  track: { track_number: number; retry_count: number; lyrics: string | null; style_prompt: string | null; title: string }
): Promise<string> {
  if (track.retry_count >= 2) {
    // Exhausted retries — mark as failed
    console.error(`[check-track] Track ${track.track_number} failed after ${track.retry_count} retries — marking failed`);

    await logGeneration({
      projectId,
      trackNumber: track.track_number,
      event: 'failed',
      errorMessage: `Exhausted ${track.retry_count} retries across model fallback chain`,
      model: 'kie-suno',
    });

    await db.from('tracks').update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', track.track_number);

    await maybeFinalizeProject(projectId);
    return 'failed';
  }

  // Retry with next model in fallback chain
  const newRetryCount = track.retry_count + 1;
  const fallbackModel = getFallbackModel(newRetryCount);

  console.log(`[check-track] Track ${track.track_number} failed — retrying (attempt ${newRetryCount}) with model ${fallbackModel}`);

  await logGeneration({
    projectId,
    trackNumber: track.track_number,
    event: 'retry',
    model: fallbackModel,
    errorMessage: `Retry ${newRetryCount} with fallback model ${fallbackModel}`,
  });

  if (!track.lyrics || !track.style_prompt) {
    // Can't retry without lyrics/style — mark failed
    await db.from('tracks').update({
      status: 'failed',
      retry_count: newRetryCount,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', track.track_number);
    return 'failed_no_lyrics';
  }

  try {
    const newTaskId = await submitKieWithWebhook(
      track.lyrics,
      track.style_prompt,
      track.title,
      projectId,
      track.track_number,
      false,
      fallbackModel
    );

    await db.from('tracks').update({
      suno_task_id: newTaskId,
      retry_count: newRetryCount,
      status: 'generating_audio',
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', track.track_number);

    return 'retrying';
  } catch (err) {
    console.error(`[check-track] Retry submission failed for track ${track.track_number}:`, err);
    await db.from('tracks').update({
      status: 'failed',
      retry_count: newRetryCount,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId).eq('track_number', track.track_number);
    return 'failed';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface KieTrackData {
  id: string;
  audioUrl?: string;
  audio_url?: string;
  imageUrl?: string;
  image_url?: string;
  modelName?: string;
  model_name?: string;
  tags?: string;
  createTime?: string;
  duration: number;
}
